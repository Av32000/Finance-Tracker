const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const AccountsAPI = require("./AccountsAPI")

const app = express();

app.use(bodyParser.json())
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});

const accountsPath = path.join(__dirname, "../", "datas")
const accountsAPI = new AccountsAPI(accountsPath)
accountsAPI.FixAccounts()

const port = parseInt(
	process.argv.find(s => s.startsWith('--port'))?.split('=')[1] || '3000',
);

app.get('/', (req, res) => {
	res.send('Finance Tracker!');
});

// Account
app.get("/accounts", (req, res) => {
	res.send(JSON.stringify(accountsAPI.GetAccounts()))
})

// TODO : Switch to /accounts
app.get("/account/:id", (req, res) => {
	if (!req.params.id) return res.sendStatus(404)
	res.send(JSON.stringify(accountsAPI.GetAccount(req.params.id)))
})

app.post("/accounts", (req, res) => {
	const name = req.body.name
	if (!name) return res.sendStatus(404)
	res.send(accountsAPI.CreateAccount(name))
})

app.patch("/accounts/:id", (req, res) => {
	const id = req.params.id
	const newName = req.body.name
	if (!id || !newName) return res.sendStatus(404)
	accountsAPI.RenameAccount(id, newName)
	res.sendStatus(200)
})

app.delete("/accounts/:id", (req, res) => {
	const id = req.params.id
	if (!id) return res.sendStatus(404)
	accountsAPI.DeleteAccount(id)
	res.sendStatus(200)
})

// Transaction
app.get("/accounts/:accountId/transactions", (req, res) => {
	const accountId = req.params.accountId
	if (!accountId) return res.sendStatus(404)
	res.send(JSON.stringify(accountsAPI.GetTransactions(accountId)))
})

app.get("/accounts/:accountId/transactions/:transactionId", (req, res) => {
	const accountId = req.params.accountId
	const transactionId = req.params.transactionId
	if (!accountId || !transactionId) return res.sendStatus(404)
	res.send(JSON.stringify(accountsAPI.GetTransaction(accountId, transactionId)))
})

app.post("/accounts/:accountId/transactions", (req, res) => {
	const accountId = req.params.accountId
	const name = req.body.name
	const amount = req.body.amount
	const date = req.body.date

	if (!accountId || !name || !amount || !date) return res.sendStatus(404)
	res.send(accountsAPI.AddTransaction(accountId, name, amount, date))
})

app.patch("/accounts/:accountId/transactions/:transactionId", (req, res) => {
	const accountId = req.params.accountId
	const transactionId = req.params.transactionId
	if (!accountId || !transactionId) return res.sendStatus(404)
	accountsAPI.PatchTransaction(accountId, transactionId, req.body)
	res.sendStatus(200)
})

app.delete("/accounts/:accountId/transactions/:transactionId", (req, res) => {
	const accountId = req.params.accountId
	const transactionId = req.params.transactionId
	if (!accountId || !transactionId) return res.sendStatus(404)
	accountsAPI.DeleteTransaction(accountId, transactionId)
	res.sendStatus(200)
})

app.listen(port, () => {
	console.log(`Finance Tracker API listening on port ${port}`);
});
