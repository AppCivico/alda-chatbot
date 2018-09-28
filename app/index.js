require('dotenv').config();

const { MessengerBot, FileSessionStore, withTyping } = require('bottender');
const { createServer } = require('bottender/restify');

const config = require('./bottender.config').messenger;
const cronjobs = require('./cronjob');

const messageWaiting = eval(process.env.TIME_WAIT); // eslint-disable-line no-eval

const bot = new MessengerBot({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
	verifyToken: config.verifyToken,
	sessionStore: new FileSessionStore(),
});

if (messageWaiting) { bot.use(withTyping({ delay: messageWaiting })); }

const handler = require('./handler');

bot.onEvent(handler);

const server = createServer(bot);

server.listen(process.env.API_PORT, () => {
	console.log(`Server is running on ${process.env.API_PORT} port...`);
	console.log(`App: ${process.env.APP} & Page: ${process.env.PAGE}`);
	console.log(`Cronjob activatedCCS is running? => ${cronjobs.activatedCCS.running ? cronjobs.activatedCCS.running : 'Nope'}`);
	console.log(`Cronjob agendaChange is running? => ${cronjobs.agendaChange.running ? cronjobs.agendaChange.running : 'Nope'}`);
	// console.log(`Cronjob agendaChange is running? => ${cronjobs.DockerTest.running ? cronjobs.DockerTest.running : 'Nope'}`);
});

process.on('SIGINT', () => { console.log('Bye bye!'); process.exit(); });
