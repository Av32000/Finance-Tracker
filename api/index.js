const fastify = require("fastify")({
  logger: {
    level: "error"
  },
});
const cors = require("@fastify/cors");
const multipart = require("@fastify/multipart");
const util = require("util");
const path = require("path");
const AccountsAPI = require("./AccountsAPI");
const { existsSync, createWriteStream, mkdirSync, readFileSync } = require("fs");
const { pipeline } = require("stream");
const { randomUUID } = require("crypto");
const fastifyJWT = require('@fastify/jwt');
const {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} = require("@simplewebauthn/server");
const { isoBase64URL, isoUint8Array } = require("@simplewebauthn/server/helpers");
const AuthAPI = require("./AuthAPI");

const filesPath = "datas/files/";
if (!existsSync("datas")) mkdirSync("datas");
if (!existsSync(filesPath)) mkdirSync(filesPath);

fastify.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PATCH"],
  allowedHeaders: "Content-Type, Authorization"
});

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, "../", filesPath),
})

fastify.register(multipart);
if (existsSync(path.join(__dirname, "keys/publicKey.pem")) && existsSync(path.join(__dirname, "keys/privateKey.pem"))) {
  const privateKey = readFileSync(path.join(__dirname, "keys/privateKey.pem"), 'utf-8');
  const publicKey = readFileSync(path.join(__dirname, "keys/publicKey.pem"), 'utf-8');

  fastify.register(fastifyJWT, {
    secret: {
      private: privateKey,
      public: publicKey,
      algorithms: ['RS256'],
    },
    sign: {
      algorithm: 'RS256',
    },
    verify: {
      algorithms: ['RS256'],
    },
    expiresIn: "7d"
  });
} else {
  console.error("\x1b[33m%s\x1b[0m", "No RSA keys found => Insecure server");
  fastify.register(fastifyJWT, {
    secret: randomUUID(),
    expiresIn: '7d',
  });
}

const unauthenticatedRoutes = ["/has-passkey", "/generate-registration-options", "/verify-registration", '/generate-authentication-options', '/verify-authentication']
fastify.addHook("onRequest", async (request, reply) => {
  try {
    if (!unauthenticatedRoutes.includes(request.raw.url)) {
      await request.jwtVerify()
    }
  } catch (err) {
    reply.code(401).send(err);
  }
})

const pump = util.promisify(pipeline);

// TODO : Add Passkey Auth
const accountsPath = path.join(__dirname, "../", "datas");
const accountsAPI = new AccountsAPI(accountsPath);
const authAPI = new AuthAPI(accountsPath)
accountsAPI.FixAccounts();
accountsAPI.CleanFile(filesPath);

const port = parseInt(
  process.argv.find((s) => s.startsWith("--port"))?.split("=")[1] || "3000"
);

fastify.get("/", async () => {
  return "Finance Tracker !";
});

// Login
fastify.get("/has-passkey", (request, reply) => {
  return authAPI.PasskeyExist() ? authAPI.GetUser().devices : false
})

fastify.get("/generate-new-key-options", async (request, reply) => {
  const {
    userId,
    username,
    devices,
  } = authAPI.GetUser();

  const opts = {
    rpName: authAPI.rpName,
    rpID: authAPI.rpID,
    userID: userId,
    userName: username,
    timeout: 60000,
    attestationType: 'none',
    excludeCredentials: devices.map((dev) => ({
      id: dev.credentialID,
      type: 'public-key',
      transports: dev.transports,
    })),
    authenticatorSelection: {
      residentKey: 'discouraged',
      userVerification: 'required',
      authenticatorAttachment: 'cross-platform'
    },
    supportedAlgorithmIDs: [-7, -257],
  };

  const options = await generateRegistrationOptions(opts);
  authAPI.SetChallenge(options.challenge)

  return options
})

fastify.post("/verify-new-key-registration", async (request, reply) => {
  const body = request.body
  const user = authAPI.GetUser()
  const expectedChallenge = authAPI.GetChallenge()

  try {
    const opts = {
      response: body,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin: authAPI.GetOrigin(),
      expectedRPID: authAPI.rpID,
      requireUserVerification: true,
    };
    verification = await verifyRegistrationResponse(opts);
  } catch (error) {
    console.error(error);
    return reply.status(400).send({ error: error.message });
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    const { credentialPublicKey, credentialID, counter } = registrationInfo;

    const existingDevice = user.devices.find((device) =>
      isoUint8Array.areEqual(device.credentialID, credentialID)
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

  authAPI.SetChallenge(null)
  authAPI.SaveData()

  return verified
})

fastify.get("/generate-registration-options", async (request, reply) => {
  if (!authAPI.PasskeyExist()) {
    const {
      userId,
      username,
      devices,
    } = authAPI.GetUser();

    const opts = {
      rpName: authAPI.rpName,
      rpID: authAPI.rpID,
      userID: userId,
      userName: username,
      timeout: 60000,
      attestationType: 'none',
      excludeCredentials: devices.map((dev) => ({
        id: dev.credentialID,
        type: 'public-key',
        transports: dev.transports,
      })),
      authenticatorSelection: {
        residentKey: 'discouraged',
        userVerification: 'required',
        authenticatorAttachment: 'platform'
      },
      supportedAlgorithmIDs: [-7, -257],
    };

    const options = await generateRegistrationOptions(opts);
    authAPI.SetChallenge(options.challenge)

    return options
  } else {
    reply.code(403).send("Passkey Already Setup")
  }
})

fastify.post("/verify-registration", async (request, reply) => {
  if (!authAPI.PasskeyExist()) {
    const body = request.body
    const user = authAPI.GetUser()
    const expectedChallenge = authAPI.GetChallenge()

    try {
      const opts = {
        response: body,
        expectedChallenge: `${expectedChallenge}`,
        expectedOrigin: authAPI.GetOrigin(),
        expectedRPID: authAPI.rpID,
        requireUserVerification: true,
      };
      verification = await verifyRegistrationResponse(opts);
    } catch (error) {
      console.error(error);
      return reply.status(400).send({ error: error.message });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = registrationInfo;

      const existingDevice = user.devices.find((device) =>
        isoUint8Array.areEqual(device.credentialID, credentialID)
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

    authAPI.SetChallenge(null)
    authAPI.SaveData()

    return verified
  }
  else {
    reply.code(403).send("Passkey Already Setup")
  }
})

fastify.get('/generate-authentication-options', async (request, reply) => {
  const user = authAPI.GetUser();

  const opts = {
    timeout: 60000,
    allowCredentials: user.devices.map((dev) => ({
      id: dev.credentialID,
      type: 'public-key',
      transports: dev.transports,
    })),
    userVerification: 'required',
    rpID: authAPI.rpID,
  };

  const options = await generateAuthenticationOptions(opts);

  authAPI.SetChallenge(options.challenge)

  return options
});

fastify.post('/verify-authentication', async (request, reply) => {
  const body = request.body;
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
      error: 'Authenticator is not registered with this site',
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
    };
    verification = await verifyAuthenticationResponse(opts);
  } catch (error) {
    console.error(error);
    return reply.code(400).send({ error: error.message });
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    dbAuthenticator.counter = authenticationInfo.newCounter;
    const token = fastify.jwt.sign({});
    authAPI.SetChallenge(null)
    authAPI.SaveData()
    authenticationInfo.token = token
    reply.send({ authenticationInfo });
  } else {
    reply.status(401)
  }
});

// Account
fastify.get("/accounts", async () => {
  return accountsAPI.GetAccounts();
});

fastify.get("/accounts/:id", async (request, reply) => {
  return accountsAPI.GetAccount(request.params.id);
});

fastify.post("/accounts", async (request, reply) => {
  const name = request.body.name;
  if (!name) throw new Error("No name found");
  return accountsAPI.CreateAccount(name);
});

fastify.patch("/accounts/:id", async (request, reply) => {
  const id = request.params.id;
  const newName = request.body.name;
  if (!id || !newName) throw new Error("No ID or NewName found");
  accountsAPI.RenameAccount(id, newName);
  reply.status(200);
});

fastify.delete("/accounts/:id", async (request, reply) => {
  const id = request.params.id;
  accountsAPI.DeleteAccount(id);
  reply.status(200);
});

// Transaction
fastify.get("/accounts/:accountId/transactions", async (request, reply) => {
  const accountId = request.params.accountId;
  return accountsAPI.GetTransactions(accountId);
});

fastify.get(
  "/accounts/:accountId/transactions/:transactionId",
  async (request, reply) => {
    const accountId = request.params.accountId;
    const transactionId = request.params.transactionId;
    return accountsAPI.GetTransaction(accountId, transactionId);
  }
);

fastify.post("/accounts/:accountId/transactions", async (request, reply) => {
  const accountId = request.params.accountId;
  const name = request.body.name;
  const description = request.body.description
  const amount = request.body.amount;
  const date = request.body.date;
  const tag = request.body.tag;
  const file = request.body.file;

  if (!accountId || !name || !amount || !date || !tag)
    throw new Error("Required field not found");
  if (file && (!file.id || !file.name)) throw new Error("File not found");
  return accountsAPI.AddTransaction(accountId, name, description, amount, date, tag, file);
});

fastify.patch(
  "/accounts/:accountId/transactions/:transactionId",
  async (request, reply) => {
    const accountId = request.params.accountId;
    const transactionId = request.params.transactionId;
    accountsAPI.PatchTransaction(accountId, transactionId, request.body);
    reply.status(200);
  }
);

fastify.delete(
  "/accounts/:accountId/transactions/:transactionId",
  async (request, reply) => {
    const accountId = request.params.accountId;
    const transactionId = request.params.transactionId;
    accountsAPI.DeleteTransaction(accountId, transactionId);
    reply.status(200);
  }
);

// Files
fastify.get("/files/:file", async (request, reply) => {
  let file = request.params.file;
  file = file.replace(/[\\/]/g, "");
  let fullPath = path.join(__dirname, "../", filesPath, file);
  if (!file || !existsSync(fullPath)) throw new Error("File not found");
  const fileContent = readFileSync(fullPath);

  reply.type('text/plain').send(fileContent);
});

// Monthly
fastify.patch("/accounts/:accountId/monthly", async (request, reply) => {
  const accountId = request.params.accountId;
  const newMonthly = request.body.monthly;
  if (!accountId || !newMonthly || typeof newMonthly !== "number")
    throw new Error("Invalid newMonthly");
  accountsAPI.SetMonthly(accountId, newMonthly);
  reply.status(200);
});

// Charts
fastify.get("/accounts/:accountId/charts", async (request, reply) => {
  const accountId = request.params.accountId;
  const account = accountsAPI.GetAccount(accountId);
  if (!account) return reply.status(400);
  return account.charts
})

fastify.get("/accounts/:accountId/charts/:chartId", async (request, reply) => {
  const accountId = request.params.accountId;
  const chartId = request.params.chartId;
  const account = accountsAPI.GetAccount(accountId);
  if (!account) return reply.status(400);
  const chart = account.charts.find(c => c.id === chartId)
  if (!chart) return reply.status(404);
  return chart
})

fastify.post("/accounts/:accountId/charts", async (request, reply) => {
  const accountId = request.params.accountId;
  const title = request.body.title;
  const filters = request.body.filters;
  const type = request.body.type;
  const options = request.body.options;
  const account = accountsAPI.GetAccount(accountId);
  if (!account || !title || filters === null || !type) return reply.status(400);
  return accountsAPI.CreateChart(accountId, title, filters, type, options)
})

fastify.delete("/accounts/:accountId/charts/:chartId", async (request, reply) => {
  const accountId = request.params.accountId;
  const chartId = request.params.chartId;
  const account = accountsAPI.GetAccount(accountId);
  if (!account) return reply.status(400);
  accountsAPI.DeleteChart(accountId, chartId)
  return reply.status(200)
})

// Settigns
fastify.get("/accounts/:accountId/settings", async (request, reply) => {
  const accountId = request.params.accountId;
  const account = accountsAPI.GetAccount(accountId);
  if (!account) return reply.status(400);
  return account.settings;
});

fastify.get(
  "/accounts/:accountId/settings/:setting",
  async (request, reply) => {
    const accountId = request.params.accountId;
    const settingName = request.params.setting;
    const account = accountsAPI.GetAccount(accountId);
    if (!account) return reply.status(400);
    const setting = account.settings.find((s) => s.name === settingName);
    if (!setting) return reply.status(400);
    return setting;
  }
);

fastify.post("/accounts/:accountId/settings", async (request, reply) => {
  const accountId = request.params.accountId;
  const newSetting = request.body;
  if (!accountId || !newSetting || !newSetting.name || !newSetting.value)
    throw new Error("Invalid Setting");
  accountsAPI.SetSetting(accountId, newSetting);
  reply.status(200);
});

fastify.post("/files/upload", async (request, reply) => {
  const data = await request.file();
  const newName = randomUUID()
  await pump(
    data.file,
    createWriteStream(
      path.join(filesPath, newName + "." + data.filename.split(".").pop())
    )
  );
  return newName;
});

fastify.listen({ port, host: "localhost" }, function (err, address) {
  authAPI.SetOrigin(`http://localhost:5173`)
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Finance Tracker API listening on ${address}`);
});
