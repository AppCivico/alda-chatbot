require('dotenv').config();

const { MessengerBot, FileSessionStore, withTyping } = require('bottender');
const { createServer } = require('bottender/restify');

// const { Pool, Client } = require('pg');

// async function test() {
// 	// pools will use environment variables
// 	// for connection information
// 	const pool = new Pool();

// 	pool.query('SELECT NOW()', (err, res) => {
// 		console.log(err, res);
// 		pool.end();
// 	});

// 	// you can also use async/await
// 	const res = await pool.query('SELECT NOW()');
// 	console.log(res);
// 	await pool.end();

// 	// clients will also use environment variables
// 	// for connection information
// 	const client = new Client();
// 	await client.connect();

// 	const res2 = await client.query('SELECT NOW()');
// 	console.log(res2);

// 	await client.end();
// }

// test();

// const { sequelize } = require('./server/index.js');

// sequelize
// 	.authenticate()
// 	.then(() => {
// 		console.log('Connection has been established successfully.');
// 	})
// 	.catch((err) => {
// 		console.error('Unable to connect to the database:', err);
// 	});

// sequelize.query('SELECT * FROM pg_catalog.pg_tables;').then((results) => {
// 	console.log(results);
// }).catch((err) => {
// 	console.log(err);
// });
const config = require('./bottender.config').messenger;

// const postbacks = require('./postback');
const messageWaiting = eval(process.env.TIME_WAIT); // eslint-disable-line no-eval


const bot = new MessengerBot({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
	verifyToken: config.verifyToken,
	sessionStore: new FileSessionStore(),
});

if (messageWaiting) {
	bot.use(withTyping({ delay: messageWaiting }));
}

const handler = require('./handler');

bot.onEvent(handler);

const server = createServer(bot);

server.listen(process.env.API_PORT, () => {
	console.log(`Server is running on ${process.env.API_PORT} port...`);
	console.log(`App: ${process.env.APP} & Page: ${process.env.PAGE}`);
});

process.on('SIGINT', () => { console.log('Bye bye!'); process.exit(); });
