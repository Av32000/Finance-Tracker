import express from 'express';
const app = express();
const port = parseInt(
	process.argv.find(s => s.startsWith('--port'))?.split('=')[1] || '3000',
);

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.listen(port, () => {
	console.log(`Finance Tracker API listening on port ${port}`);
});
