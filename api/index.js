const fastify = require("fastify")({
  logger: false,
});
const cors = require("@fastify/cors");
const multipart = require("@fastify/multipart");
const util = require("util");
const path = require("path");
const AccountsAPI = require("./AccountsAPI");
const { existsSync, createWriteStream, createReadStream, readFileSync } = require("fs");
const { pipeline } = require("stream");
const { randomUUID } = require("crypto");

const filesPath = "datas/files/";
if (!existsSync(filesPath)) mkdirSync(filesPath);

fastify.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PATCH"],
  allowedHeaders: "Content-Type, Authorization"
});

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname,"../", filesPath),
})

fastify.register(multipart);

const pump = util.promisify(pipeline);

// TODO : Add Passkey Auth
const accountsPath = path.join(__dirname, "../", "datas");
const accountsAPI = new AccountsAPI(accountsPath);
accountsAPI.FixAccounts();
accountsAPI.CleanFile(filesPath);

const port = parseInt(
  process.argv.find((s) => s.startsWith("--port"))?.split("=")[1] || "3000"
);

fastify.get("/", async () => {
  return "Finance Tracker !";
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
  const amount = request.body.amount;
  const date = request.body.date;
  const tag = request.body.tag;
  const file = request.body.file;

  if (!accountId || !name || !amount || !date || !tag)
    throw new Error("Required field not found");
  if (file && (!file.id || !file.name)) throw new Error("File not found");
  return accountsAPI.AddTransaction(accountId, name, amount, date, tag, file);
});

fastify.patch(
  "/accounts/:accountId/transactions/:transactionId",
  async (request, reply) => {
    const accountId = request.params.accountId;
    const transactionId = request.params.transactionId;
    accountsAPI.PatchTransaction(accountId, transactionId, req.body);
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
  console.log(fullPath);
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

// Chart
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
  const account = accountsAPI.GetAccount(accountId);
  if (!account || !title || filters === null || !type) return reply.status(400);
  return accountsAPI.CreateChart(accountId, title, filters, type)
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
      path.join(filesPath,newName + "." + data.filename.split(".").pop())
    )
  );
  return newName;
});

fastify.listen({ port, host: "localhost" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Finance Tracker API listening on ${address}`);
});
