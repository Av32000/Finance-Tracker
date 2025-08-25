import cors from "@fastify/cors";
import { FastifyJwtNamespace } from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { ChartSchema } from "@finance-tracker/types";
import {
  generateAuthenticationOptions,
  GenerateAuthenticationOptionsOpts,
  generateRegistrationOptions,
  GenerateRegistrationOptionsOpts,
  verifyAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
  verifyRegistrationResponse,
  VerifyRegistrationResponseOpts,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import { exec } from "child_process";
import { randomUUID } from "crypto";
import Fastify from "fastify";
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs";
import mimeTypes from "mime-types";
import path from "path";
import { pipeline } from "stream";
import util from "util";
import AccountsAPI from "./AccountsAPI";
import AuthAPI from "./AuthAPI";
import Cmd from "./cmd";
import { buildInfo } from "./utils/buildInfo";
import { getDataPath, getFilesPath } from "./utils/paths";

declare module "fastify" {
  interface FastifyInstance
    extends FastifyJwtNamespace<{ namespace: "security" }> {}
}

const fastify = Fastify({
  logger: {
    level: "error",
  },
});

const insecure = process.argv.includes("--insecure");
if (insecure) {
  console.warn("\x1b[33m%s\x1b[0m", "--insecure flag used => Insecure server");
}

const offline = process.argv.includes("--offline");
if (offline) {
  console.warn(
    "\x1b[33m%s\x1b[0m",
    "--offline flag used => Unsynchronised data",
  );
}

const standalone = process.argv.includes("--standalone");
if (standalone) {
  console.warn(
    "\x1b[33m%s\x1b[0m",
    "--standalone flag used => Using user config directory",
  );
}

// Determine paths based on standalone mode
const dataPath = getDataPath(standalone);
const filesPath = getFilesPath(standalone);

// Ensure directories exist
if (!existsSync(dataPath)) mkdirSync(dataPath, { recursive: true });
if (!existsSync(filesPath)) mkdirSync(filesPath, { recursive: true });

fastify.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PATCH"],
  allowedHeaders: "Content-Type, Authorization",
});

fastify.register(require("@fastify/static"), {
  root: filesPath,
  prefix: "/api",
  decorateReply: false,
});

if (process.env.NODE_ENV == "production") {
  fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "..", "front"),
    prefix: "/",
  });
}

fastify.register(multipart, {
  limits: {
    fileSize: 1000 * 1024 * 1024,
  },
});
if (
  existsSync(path.join(__dirname, "keys/publicKey.pem")) &&
  existsSync(path.join(__dirname, "keys/privateKey.pem"))
) {
  const privateKey = readFileSync(
    path.join(__dirname, "keys/privateKey.pem"),
    "utf-8",
  );
  const publicKey = readFileSync(
    path.join(__dirname, "keys/publicKey.pem"),
    "utf-8",
  );

  fastify.register(require("@fastify/jwt"), {
    secret: {
      private: privateKey,
      public: publicKey,
      algorithms: ["RS256"],
    },
    sign: {
      algorithm: "RS256",
    },
    verify: {
      algorithms: ["RS256"],
    },
    expiresIn: "7d",
  });
} else {
  console.error("\x1b[33m%s\x1b[0m", "No RSA keys found => Insecure server");
  fastify.register(require("@fastify/jwt"), {
    secret: randomUUID(),
    expiresIn: "7d",
  });
}

const unauthenticatedRoutes = [
  "/api/has-passkey",
  "/api/generate-registration-options",
  "/api/verify-registration",
  "/api/generate-authentication-options",
  "/api/verify-authentication",
  "/api/verify-otp",
  "/api/info",
];
fastify.addHook("onRequest", async (request, reply) => {
  try {
    if (
      !unauthenticatedRoutes.includes(request.raw.url as string) &&
      !insecure &&
      (request.raw.url as string).startsWith("/api") &&
      (authAPI.data.devices.length > 0 || authAPI.data.otpActivated)
    ) {
      await request.jwtVerify();
    }
  } catch (err) {
    reply.code(401).send(err);
  }
});

const pump = util.promisify(pipeline);

// Function to open URL in default browser
function openBrowser(url: string) {
  const platform = process.platform;
  let command: string;

  switch (platform) {
    case "darwin": // macOS
      command = `open "${url}"`;
      break;
    case "win32": // Windows
      command = `start "" "${url}"`;
      break;
    default: // Linux and others
      command = `xdg-open "${url}"`;
      break;
  }

  exec(command);
}

// In standalone mode, force offline behavior (no database connection)
const isOffline = offline || standalone;

const accountsAPI = new AccountsAPI(dataPath, filesPath, isOffline);
const authAPI = new AuthAPI(dataPath);
accountsAPI.FixAccounts();

fastify.register(
  async (api) => {
    api.get("/", async () => {
      return "Finance Tracker !";
    });

    // Login
    api.get("/has-passkey", (request, reply) => {
      return authAPI.PasskeyExist() ? authAPI.GetUser().devices : false;
    });

    api.get("/generate-new-key-options", async (request, reply) => {
      const { userId, username, devices } = authAPI.GetUser();

      const opts = {
        rpName: authAPI.rpName,
        rpID: authAPI.rpID,
        userID: userId,
        userName: username,
        timeout: 60000,
        attestationType: "none",
        excludeCredentials: devices.map((dev) => ({
          id: dev.credentialID,
          type: "public-key" as "public-key",
          transports: dev.transports,
        })),
        authenticatorSelection: {
          residentKey: "discouraged",
          userVerification: "required",
          authenticatorAttachment: "cross-platform",
        },
        supportedAlgorithmIDs: [-7, -257],
      } as GenerateRegistrationOptionsOpts;

      const options = await generateRegistrationOptions(opts);
      authAPI.SetChallenge(options.challenge);

      return options;
    });

    api.post("/verify-new-key-registration", async (request, reply) => {
      const body = request.body as any;
      const user = authAPI.GetUser();
      const expectedChallenge = authAPI.GetChallenge();
      let verification;
      try {
        const opts = {
          response: body,
          expectedChallenge: `${expectedChallenge}`,
          expectedOrigin: authAPI.GetOrigin(),
          expectedRPID: authAPI.rpID,
          requireUserVerification: true,
        } as VerifyRegistrationResponseOpts;
        verification = await verifyRegistrationResponse(opts);
      } catch (error) {
        console.error(error);
        return reply.status(400).send({ error: (error as Error).message });
      }

      const { verified, registrationInfo } = verification;

      if (verified && registrationInfo) {
        const { credentialPublicKey, credentialID, counter } = registrationInfo;

        const existingDevice = user.devices.find((device) =>
          isoUint8Array.areEqual(device.credentialID, credentialID),
        );

        if (!existingDevice) {
          const newDevice = {
            credentialPublicKey,
            credentialID,
            counter,
            transports: body.response.transports,
          };
          user.devices.push(newDevice);
        }
      }

      authAPI.SetChallenge(null);
      authAPI.SaveData();

      return verified;
    });

    api.get("/generate-registration-options", async (request, reply) => {
      if (!authAPI.PasskeyExist()) {
        const { userId, username, devices } = authAPI.GetUser();

        const opts = {
          rpName: authAPI.rpName,
          rpID: authAPI.rpID,
          userID: userId,
          userName: username,
          timeout: 60000,
          attestationType: "none",
          excludeCredentials: devices.map((dev) => ({
            id: dev.credentialID,
            type: "public-key",
            transports: dev.transports,
          })),
          authenticatorSelection: {
            residentKey: "discouraged",
            userVerification: "required",
            authenticatorAttachment: "platform",
          },
          supportedAlgorithmIDs: [-7, -257],
        } as GenerateRegistrationOptionsOpts;

        const options = await generateRegistrationOptions(opts);
        authAPI.SetChallenge(options.challenge);

        return options;
      } else {
        reply.code(403).send("Passkey Already Setup");
      }
    });

    api.post("/verify-registration", async (request, reply) => {
      if (!authAPI.PasskeyExist()) {
        const body = request.body as any;
        const user = authAPI.GetUser();
        const expectedChallenge = authAPI.GetChallenge();
        let verification;
        try {
          const opts = {
            response: body,
            expectedChallenge: `${expectedChallenge}`,
            expectedOrigin: authAPI.GetOrigin(),
            expectedRPID: authAPI.rpID,
            requireUserVerification: true,
          } as VerifyRegistrationResponseOpts;
          verification = await verifyRegistrationResponse(opts);
        } catch (error) {
          console.error(error);
          return reply.status(400).send({ error: (error as Error).message });
        }

        const { verified, registrationInfo } = verification;

        if (verified && registrationInfo) {
          const { credentialPublicKey, credentialID, counter } =
            registrationInfo;

          const existingDevice = user.devices.find((device) =>
            isoUint8Array.areEqual(device.credentialID, credentialID),
          );

          if (!existingDevice) {
            const newDevice = {
              credentialPublicKey,
              credentialID,
              counter,
              transports: body.response.transports,
            };
            user.devices.push(newDevice);
          }
        }

        authAPI.SetChallenge(null);
        authAPI.SaveData();

        return verified;
      } else {
        reply.code(403).send("Passkey Already Setup");
      }
    });

    api.get("/generate-authentication-options", async (request, reply) => {
      const user = authAPI.GetUser();

      const opts = {
        timeout: 60000,
        allowCredentials: user.devices.map((dev) => ({
          id: dev.credentialID,
          type: "public-key",
          transports: dev.transports,
        })),
        userVerification: "required",
        rpID: authAPI.rpID,
      } as GenerateAuthenticationOptionsOpts;

      const options = await generateAuthenticationOptions(opts);

      authAPI.SetChallenge(options.challenge);

      return options;
    });

    api.post("/verify-authentication", async (request, reply) => {
      const body = request.body as any;
      const user = authAPI.GetUser();
      const expectedChallenge = authAPI.GetChallenge();

      let dbAuthenticator;
      const bodyCredIDBuffer = isoBase64URL.toBuffer(body.rawId);
      for (const dev of user.devices) {
        if (isoUint8Array.areEqual(dev.credentialID, bodyCredIDBuffer)) {
          dbAuthenticator = dev;
          break;
        }
      }

      if (!dbAuthenticator) {
        return reply.code(400).send({
          error: "Authenticator is not registered with this site",
        });
      }

      let verification;
      try {
        const opts = {
          response: body,
          expectedChallenge: `${expectedChallenge}`,
          expectedOrigin: authAPI.GetOrigin(),
          expectedRPID: authAPI.rpID,
          authenticator: dbAuthenticator,
          requireUserVerification: true,
        } as VerifyAuthenticationResponseOpts;
        verification = await verifyAuthenticationResponse(opts);
      } catch (error) {
        console.error(error);
        return reply.code(400).send({ error: (error as Error).message });
      }

      const { verified, authenticationInfo } = verification;

      if (verified) {
        dbAuthenticator.counter = authenticationInfo.newCounter;
        const token = fastify.jwt.sign({});
        authAPI.SetChallenge(null);
        authAPI.SaveData();
        (authenticationInfo as any).token = token;
        reply.send({ authenticationInfo });
      } else {
        reply.status(401);
      }
    });

    let timeout = false;

    api.post("/verify-otp", async (req, res) => {
      if (timeout) {
        res.status(403).send("Timeout");
        return;
      }
      const token = (req.body as any)?.token;

      if (!token) {
        res.status(400);
        return;
      }

      if (authAPI.VerifyOTP(token)) {
        const token = fastify.jwt.sign({});
        return { token };
      } else {
        timeout = true;
        setTimeout(() => (timeout = false), 1000);
        res.status(403).send("Invalid OTP");
        return;
      }
    });

    api.get("/activate-otp", (req, res) => {
      authAPI.ActivateOTP();
      res.status(200).send();
    });

    api.get("/get-otp", async (req, res) => {
      return authAPI.GetOtpURL();
    });

    api.get("/version", async (req, res) => {
      return buildInfo;
    });

    // Account
    api.get("/accounts", async () => {
      return accountsAPI.GetAccounts();
    });

    api.get("/accounts/:id", async (request, reply) => {
      return accountsAPI.GetAccount((request.params as any).id);
    });

    api.get("/accounts/:id/export", async (request, reply) => {
      const buffer = await accountsAPI.ExportAccount(
        (request.params as any).id,
      );
      if (buffer != null) {
        reply.header(
          "Content-Disposition",
          `attachment; filename=${accountsAPI
            .GetAccount((request.params as any).id)
            ?.name.replace(/[^a-zA-Z0-9-_.]/g, "")}.zip`,
        );
        reply.type("application/zip").send(buffer);
      } else {
        reply.status(404);
      }
    });

    api.post("/accounts/:id/import", async (request, reply) => {
      const data = await request.file();
      if (!data) return;
      const force = (request.query as any).force === "true";

      const bufferPromise = new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        data.file.on("data", (chunk) => {
          chunks.push(chunk);
        });

        data.file.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });

        data.file.on("error", (err) => {
          reject(err);
        });
      });

      const buffer = (await bufferPromise) as Buffer;

      const importResult = await accountsAPI.ImportAccount(buffer, force);

      if (typeof importResult == "string") {
        reply.code(200).send(importResult);
      } else if (importResult == 1) {
        reply.code(400).send("Invalid zip file");
      } else if (importResult == 2) {
        reply.status(403);
      } else if (importResult == 3) {
        reply.code(400).send("Missing files");
      }
    });

    api.post("/accounts", async (request, reply) => {
      const name = (request.body as any).name;
      if (!name) throw new Error("No name found");
      return accountsAPI.CreateAccount(name);
    });

    api.patch("/accounts/:id", async (request, reply) => {
      const id = (request.params as any).id;
      const newName = (request.body as any).name;
      if (!id || !newName) throw new Error("No ID or NewName found");
      accountsAPI.RenameAccount(id, newName);
      reply.status(200);
    });

    api.delete("/accounts/:id", async (request, reply) => {
      const id = (request.params as any).id;
      accountsAPI.DeleteAccount(id);
      reply.status(200);
    });

    // Transaction
    api.get("/accounts/:accountId/transactions", async (request, reply) => {
      const accountId = (request.params as any).accountId;
      return accountsAPI.GetTransactions(accountId);
    });

    api.get(
      "/accounts/:accountId/transactions/:transactionId",
      async (request, reply) => {
        const accountId = (request.params as any).accountId;
        const transactionId = (request.params as any).transactionId;
        return accountsAPI.GetTransaction(accountId, transactionId);
      },
    );

    api.post("/accounts/:accountId/transactions", async (request, reply) => {
      const accountId = (request.params as any).accountId;
      const name = (request.body as any).name;
      const description = (request.body as any).description;
      const amount = (request.body as any).amount;
      const date = (request.body as any).date;
      const tags = (request.body as any).tags;
      const file = (request.body as any).file;

      if (!accountId || !name || !amount || !date || !tags)
        throw new Error("Required field not found");
      if (file && (!file.id || !file.name)) throw new Error("File not found");
      return accountsAPI.AddTransaction(
        accountId,
        name,
        description,
        amount,
        date,
        tags,
        file,
      );
    });

    api.patch(
      "/accounts/:accountId/transactions/:transactionId",
      async (request, reply) => {
        const accountId = (request.params as any).accountId;
        const transactionId = (request.params as any).transactionId;
        accountsAPI.PatchTransaction(
          accountId,
          transactionId,
          request.body as any,
        );
        reply.status(200);
      },
    );

    api.delete(
      "/accounts/:accountId/transactions/:transactionId",
      async (request, reply) => {
        const accountId = (request.params as any).accountId;
        const transactionId = (request.params as any).transactionId;
        accountsAPI.DeleteTransaction(accountId, transactionId);
        reply.status(200);
      },
    );

    // Files
    api.get("/files/:file", async (request, reply) => {
      let file = (request.params as any).file;
      file = file.replace(/[\\/]/g, "");
      let fullPath = path.join(filesPath, file);

      if (!file || !existsSync(fullPath)) {
        return reply.code(404).send("File not found");
      }

      const fileContent = readFileSync(fullPath);

      // Use mimeTypes.lookup to determine the content type
      const mimeType = mimeTypes.lookup(file);

      if (mimeType) {
        reply.type(mimeType).send(fileContent);
      } else {
        reply.type("application/octet-stream").send(fileContent);
      }
    });

    // Monthly
    api.patch("/accounts/:accountId/monthly", async (request, reply) => {
      const accountId = (request.params as any).accountId;
      const newMonthly = (request.body as any).monthly;
      if (!accountId || !newMonthly || typeof newMonthly !== "number")
        throw new Error("Invalid newMonthly");
      accountsAPI.SetMonthly(accountId, newMonthly);
      reply.status(200);
    });

    // Tags
    api.get("/accounts/:accountId/tags", async (request, reply) => {
      const accountId = (request.params as any).accountId;
      if (!accountId) throw new Error("Invalid Account ID");
      const account = accountsAPI.GetAccount(accountId);
      if (!account) return reply.status(400);
      return account.tags;
    });

    api.post("/accounts/:accountId/tags", async (request, reply) => {
      const accountId = (request.params as any).accountId;
      const tagName = (request.body as any)?.tagName;
      const tagColor = (request.body as any)?.tagColor;
      if (!accountId) throw new Error("Invalid Account ID");
      const account = accountsAPI.GetAccount(accountId);
      if (!account) return reply.status(400);
      return accountsAPI.CreateTag(accountId, tagName, tagColor);
    });

    api.patch("/accounts/:accountId/tags/:tagId", async (request, reply) => {
      const accountId = (request.params as any).accountId;
      const tagId = (request.params as any).tagId;
      const tagName = (request.body as any)?.tagName;
      const tagColor = (request.body as any)?.tagColor;
      if (!accountId || !tagId) throw new Error("Invalid Props");
      const account = accountsAPI.GetAccount(accountId);
      if (!account) return reply.status(400);
      const isValid = accountsAPI.UpdateTag(
        accountId,
        tagId,
        tagName,
        tagColor,
      );
      if (isValid) reply.status(200);
      else reply.status(400);
    });

    api.delete("/accounts/:accountId/tags/:tagId", async (request, reply) => {
      const accountId = (request.params as any).accountId;
      const tagId = (request.params as any).tagId;
      if (!accountId || !tagId) throw new Error("Invalid Propos");
      const account = accountsAPI.GetAccount(accountId);
      if (!account) return reply.status(400);
      accountsAPI.DeleteTag(accountId, tagId);
      reply.status(200);
    });

    // Charts
    api.get("/accounts/:accountId/charts", async (request, reply) => {
      const accountId = (request.params as any).accountId;
      if (!accountId) throw new Error("Invalid Account ID");
      const account = accountsAPI.GetAccount(accountId);
      if (!account) return reply.status(400);
      return account.charts;
    });

    api.post("/accounts/:accountId/charts", async (request, reply) => {
      const accountId = (request.params as any).accountId;
      const chart = ChartSchema.parse(request.body);
      if (!accountId) throw new Error("Invalid Account ID");
      const account = accountsAPI.GetAccount(accountId);
      if (!account) return reply.status(400);
      return accountsAPI.CreateChart(accountId, chart);
    });

    api.patch(
      "/accounts/:accountId/charts/:chartId",
      async (request, reply) => {
        const accountId = (request.params as any).accountId;
        const chartId = (request.params as any).chartId;
        const chart = ChartSchema.parse(request.body);
        chart.id = chartId;
        if (!accountId || !chartId) throw new Error("Invalid Props");
        const account = accountsAPI.GetAccount(accountId);
        if (!account) return reply.status(400);
        const isValid = accountsAPI.UpdateChart(accountId, chart);
        if (isValid) reply.status(200);
        else reply.status(400);
      },
    );

    api.delete(
      "/accounts/:accountId/charts/:chartId",
      async (request, reply) => {
        const accountId = (request.params as any).accountId;
        const chartId = (request.params as any).chartId;
        if (!accountId || !chartId) throw new Error("Invalid Props");
        const account = accountsAPI.GetAccount(accountId);
        if (!account) return reply.status(400);
        accountsAPI.DeleteChart(accountId, chartId);
        reply.status(200);
      },
    );

    // Settigns
    api.get("/accounts/:accountId/settings", async (request, reply) => {
      const accountId = (request.params as any).accountId;
      const account = accountsAPI.GetAccount(accountId);
      if (!account) return reply.status(400);
      return account.settings;
    });

    api.get(
      "/accounts/:accountId/settings/:setting",
      async (request, reply) => {
        const accountId = (request.params as any).accountId;
        const settingName = (request.params as any).setting;
        const account = accountsAPI.GetAccount(accountId);
        if (!account) return reply.status(400);
        const setting = account.settings.find((s) => s.name === settingName);
        if (!setting) return reply.status(400);
        return setting;
      },
    );

    api.post("/accounts/:accountId/settings", async (request, reply) => {
      const accountId = (request.params as any).accountId;
      const newSetting = request.body as any;
      if (!accountId || !newSetting || !newSetting.name || !newSetting.value)
        throw new Error("Invalid Setting");
      accountsAPI.SetSetting(accountId, newSetting);
      reply.status(200);
    });

    api.post("/files/upload", async (request, reply) => {
      const data = await request.file();
      if (!data) return;
      const newName = randomUUID();
      await pump(
        data.file,
        createWriteStream(
          path.join(filesPath, newName + "." + data.filename.split(".").pop()),
        ),
      );
      return newName;
    });
  },
  { prefix: "/api" },
);

const routes = ["/home", "/transactions", "/settings", "/stats"];

routes.forEach((route) => {
  fastify.route({
    method: "GET",
    url: route,
    handler: (request, reply) => {
      // @ts-ignore: Ignore TypeScript error on sendFile method
      reply.sendFile("index.html");
    },
  });
});

const hostArg = process.argv.find((arg) => arg.startsWith("--host="));
const port = parseInt(
  process.argv.find((s) => s.startsWith("--port="))?.split("=")[1] || "3000",
);

fastify.listen(
  { port, host: hostArg != null ? hostArg.split("=")[1] : "localhost" },
  function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`Finance Tracker listening on ${address}`);

    // Auto-open browser when in standalone mode
    if (standalone) {
      console.log(
        "🌐 Attempting to open Finance Tracker in your default browser...",
      );
      setTimeout(() => {
        openBrowser(address);
      }, 1000);
    }

    new Cmd(accountsAPI);
  },
);
