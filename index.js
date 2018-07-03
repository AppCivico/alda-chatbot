require('dotenv').config();

const { MessengerBot } = require('bottender');
const { createServer } = require('bottender/restify');

// const postbacks = require('./postback');
const config = require('./bottender.config.js').messenger;

const bot = new MessengerBot({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

bot.onEvent(async (context) => {
	if (!context.event.isDelivery && !context.event.isEcho) {
		await context.sendText('Hello World');
	}
});

const server = createServer(bot);

server.listen(process.env.API_PORT, () => {
	console.log(`Server is running on ${process.env.API_PORT} port...`);
	console.log(`App: ${process.env.APP} & Page: ${process.env.PAGE}`);
});
