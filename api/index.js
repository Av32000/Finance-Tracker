const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const AccountsAPI = require("./AccountsAPI")

const app = express();

app.use(bodyParser.json())
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*'); // Autorise tous les ports de localhost.
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});

const accountsPath = path.join(__dirname, "../", "datas")
const accountsAPI = new AccountsAPI(accountsPath)

const port = parseInt(
	process.argv.find(s => s.startsWith('--port'))?.split('=')[1] || '3000',
);

app.get('/', (req, res) => {
	res.send('Finance Tracker!');
});

app.listen(port, () => {
	console.log(`Finance Tracker API listening on port ${port}`);
});
