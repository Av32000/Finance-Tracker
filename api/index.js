const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const AccountsAPI = require("./AccountsAPI");
const { upload, filePath } = require("./upload");
const { existsSync } = require("fs");

const app = express();

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// TODO : Add Passkey Auth

const accountsPath = path.join(__dirname, "../", "datas");
const accountsAPI = new AccountsAPI(accountsPath);
accountsAPI.FixAccounts();
accountsAPI.CleanFile(filePath);

const port = parseInt(
  process.argv.find((s) => s.startsWith("--port"))?.split("=")[1] || "3000"
);

app.get("/", (req, res) => {
  res.send("Finance Tracker!");
});

// Account
app.get("/accounts", (req, res) => {
  res.send(JSON.stringify(accountsAPI.GetAccounts()));
});

// TODO : Switch to /accounts
app.get("/account/:id", (req, res) => {
  if (!req.params.id) return res.sendStatus(400);
  res.send(JSON.stringify(accountsAPI.GetAccount(req.params.id)));
});

app.post("/accounts", (req, res) => {
  const name = req.body.name;
  if (!name) return res.sendStatus(400);
  res.send(accountsAPI.CreateAccount(name));
});

app.patch("/accounts/:id", (req, res) => {
  const id = req.params.id;
  const newName = req.body.name;
  if (!id || !newName) return res.sendStatus(400);
  accountsAPI.RenameAccount(id, newName);
  res.sendStatus(200);
});

app.delete("/accounts/:id", (req, res) => {
  const id = req.params.id;
  if (!id) return res.sendStatus(400);
  accountsAPI.DeleteAccount(id);
  res.sendStatus(200);
});

// Transaction
app.get("/accounts/:accountId/transactions", (req, res) => {
  const accountId = req.params.accountId;
  if (!accountId) return res.sendStatus(400);
  res.send(JSON.stringify(accountsAPI.GetTransactions(accountId)));
});

app.get("/accounts/:accountId/transactions/:transactionId", (req, res) => {
  const accountId = req.params.accountId;
  const transactionId = req.params.transactionId;
  if (!accountId || !transactionId) return res.sendStatus(400);
  res.send(
    JSON.stringify(accountsAPI.GetTransaction(accountId, transactionId))
  );
});

app.post("/accounts/:accountId/transactions", (req, res) => {
  const accountId = req.params.accountId;
  const name = req.body.name;
  const amount = req.body.amount;
  const date = req.body.date;
  const tag = req.body.tag;
  const file = req.body.file;

  if (!accountId || !name || !amount || !date || !tag)
    return res.sendStatus(400);
  if (file && (!file.id || !file.name)) return res.sendStatus(400);
  res.send(
    accountsAPI.AddTransaction(accountId, name, amount, date, tag, file)
  );
});

app.patch("/accounts/:accountId/transactions/:transactionId", (req, res) => {
  const accountId = req.params.accountId;
  const transactionId = req.params.transactionId;
  if (!accountId || !transactionId) return res.sendStatus(400);
  accountsAPI.PatchTransaction(accountId, transactionId, req.body);
  res.sendStatus(200);
});

app.delete("/accounts/:accountId/transactions/:transactionId", (req, res) => {
  const accountId = req.params.accountId;
  const transactionId = req.params.transactionId;
  if (!accountId || !transactionId) return res.sendStatus(400);
  accountsAPI.DeleteTransaction(accountId, transactionId);
  res.sendStatus(200);
});

// Files
app.get("/files/:file", (req, res) => {
  let file = req.params.file;
  file = file.replace(/[\\/]/g, "");
  let fullPath = path.join(__dirname, "../", filePath, file);
  if (!file || !existsSync(fullPath)) return res.sendStatus(400);
  res.sendFile(fullPath);
});

// Monthly
app.patch("/accounts/:accountId/monthly", (req, res) => {
  const accountId = req.params.accountId;
  const newMonthly = req.body.monthly;
  if (!accountId || !newMonthly || typeof newMonthly !== 'number') return res.sendStatus(400);
  accountsAPI.SetMonthly(accountId, newMonthly)
  res.sendStatus(200)
});

// Settigns
app.get("/accounts/:accountId/settings", (req, res) => {
  const accountId = req.params.accountId;
  if (!accountId) return res.sendStatus(400);
  const account = accountsAPI.GetAccount(accountId);
  if (!account) return res.sendStatus(400);
  res.send(JSON.stringify(account.settings));
});

app.get("/accounts/:accountId/settings/:setting", (req, res) => {
  const accountId = req.params.accountId;
  const settingName = req.params.setting;
  if (!accountId || settingName) return res.sendStatus(400);
  const account = accountsAPI.GetAccount(accountId);
  if (!account) return res.sendStatus(400);
  const setting = account.settings.find((s) => s.name === settingName);
  if (!setting) return res.sendStatus(400);
  res.send(JSON.stringify(setting));
});

app.post("/accounts/:accountId/settings/", (req, res) => {
  const accountId = req.params.accountId;
  const newSetting = req.body;
  if (!accountId || !newSetting || !newSetting.name || !newSetting.value)
    return res.sendStatus(400);
  accountsAPI.SetSetting(accountId, newSetting);
  res.sendStatus(200);
});

app.post("/files/upload", upload.single("file"), (req, res) => {
  res.send(req.file.filename.split(".")[0]);
});

app.listen(port, () => {
  console.log(`Finance Tracker API listening on port ${port}`);
});
