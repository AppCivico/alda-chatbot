require('dotenv').config();

const { MessengerBot } = require('bottender');
const { createServer } = require('bottender/restify');
const { FileSessionStore } = require('bottender');

// const postbacks = require('./postback');
const config = require('./bottender.config').messenger;
const flow = require('./flow');

const bot = new MessengerBot({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
	verifyToken: config.verifyToken,
	sessionStore: new FileSessionStore(),
});

const timeLimit = 1000 * 60 * 60; // 60 minutes

bot.onEvent(async (context) => {
	if (!context.event.isDelivery && !context.event.isEcho) {
		if ((context.event.rawEvent.timestamp - context.session.lastActivity) >= timeLimit) {
			if (context.session.user.first_name) { // check if first_name to avoid an 'undefined' value
				await context.sendText(`Olá, ${context.session.user.first_name}! ${flow.greetings.comeBack}`);
			} else {
				await context.sendText(`Olá! ${flow.greetings.comeBack}`);
			}
			await context.setState({ dialog: 'mainMenu' });
		} else if (context.event.isPostback) {
			const { payload } = context.event.postback;
			await context.setState({ dialog: payload });
		} else if (context.event.isQuickReply) {
			const { payload } = context.event.quickReply;
			await context.setState({ dialog: payload });
		} else if (context.event.isText) {
			// const payload = await context.event.message.text;
			await context.sendText(flow.error.noText);
			await context.setState({ dialog: 'mainMenu' });
		} else if (context.event.hasAttachment || context.event.isLikeSticker ||
			context.event.isFile || context.event.isVideo || context.event.isAudio ||
			context.event.isImage || context.event.isFallback) {
			await context.sendImage(flow.greetings.likeImage);
			await context.setState({ dialog: 'mainMenu' });
		}

		switch (context.state.dialog) {
		case 'greetings':
			// await context.sendImage(flow.greetings.greetImage);
			await context.sendText(flow.greetings.welcome);
			await context.sendText(flow.greetings.firstMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.greetings.menuOptions[0],
						payload: flow.greetings.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.greetings.menuOptions[1],
						payload: flow.greetings.menuPostback[1],
					},
				],
			});
			break;
		case 'aboutMe':
			await context.sendText(flow.aboutMe.firstMessage);
			await context.sendText(flow.aboutMe.secondMessage);
			await context.sendText(flow.aboutMe.thirdMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.aboutMe.menuOptions[0],
						payload: flow.aboutMe.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.aboutMe.menuOptions[1],
						payload: flow.aboutMe.menuPostback[1],
					},
				],
			});
			break;
		case 'mainMenu':

			break;
		}
	}
});

const server = createServer(bot);

server.listen(process.env.API_PORT, () => {
	console.log(`Server is running on ${process.env.API_PORT} port...`);
	console.log(`App: ${process.env.APP} & Page: ${process.env.PAGE}`);
});
