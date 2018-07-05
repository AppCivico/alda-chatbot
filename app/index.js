require('dotenv').config();

const { MessengerBot, FileSessionStore } = require('bottender');
const { createServer } = require('bottender/restify');

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
			await context.setState({ dialog: context.event.postback.payload });
		} else if (context.event.isQuickReply) {
			await context.setState({ postPayload: context.event.quickReply.payload });
			if (context.state.postPayload === 'notMe') {
				await context.sendText(flow.aboutMe.notNow);
				await context.setState({ dialog: 'aboutMeMenu' });
			} else if (context.state.postPayload === 'notCCS') {
				await context.sendText(flow.whichCCS.notNow);
				await context.setState({ dialog: 'whichCCSMenu' });
			} else if (context.state.postPayload === 'noLocation') {
				await context.sendText(flow.mainMenu.notNow);
				await context.setState({ dialog: 'mainMenu' });
			} else if (context.state.postPayload === 'notWannaKnow') {
				await context.sendText(flow.councilMenu.notNow);
				await context.setState({ dialog: 'councilMenu' });
			} else if (context.state.postPayload === 'neverWent') {
				await context.sendText(flow.nearestcouncil.neverWent);
				await context.setState({ dialog: 'wentAlreadyMenu' });
			} else {
				await context.setState({ dialog: context.state.postPayload });
			}
		} else if (context.event.isText) {
			if (context.state.dialog === 'wantToType') {
				await context.setState({ location: context.event.message.text });
				await context.setState({ dialog: 'foundLocation' });
			} else if (context.state.dialog === 'wantToChange') {
				await context.setState({ location: context.event.message.text });
				await context.setState({ dialog: 'foundLocation' });
			} else {	// const payload = await context.event.message.text;
				await context.sendText(flow.error.noText);
				await context.setState({ dialog: 'mainMenu' });
			}
		} else if (context.event.isLocation) {
			await context.setState({ location: context.event.location.coordinates });
			await context.setState({ dialog: 'foundLocation' });
		} else if (context.event.hasAttachment || context.event.isLikeSticker ||
			context.event.isFile || context.event.isVideo || context.event.isAudio ||
			context.event.isImage || context.event.isFallback) {
			await context.sendImage(flow.greetings.likeImage);
			await context.setState({ dialog: 'mainMenu' });
		}

		switch (context.state.dialog) {
		case 'greetings':
			await context.typingOn();
			// await context.sendImage(flow.greetings.greetImage);
			await context.sendText(flow.greetings.welcome);
			await context.typingOff();
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
			// falls through
		case 'aboutMeMenu':
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
		case 'whichCCS':
			await context.sendText(flow.whichCCS.firstMessage);
			await context.sendText(flow.whichCCS.secondMessage);
			await context.typingOn();
			await context.sendImage(flow.whichCCS.CSSImage);
			await context.typingOff();
			// falls through
		case 'whichCCSMenu':
			await context.sendText(flow.whichCCS.thirdMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.whichCCS.menuOptions[0],
						payload: flow.whichCCS.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.whichCCS.menuOptions[1],
						payload: flow.whichCCS.menuPostback[1],
					},
					{
						content_type: 'text',
						title: flow.whichCCS.menuOptions[2],
						payload: flow.whichCCS.menuPostback[2],
					},
				],
			});
			break;
		case 'sendLocation':
			await context.sendText(flow.sendLocation.firstMessage);
			await context.sendText(flow.sendLocation.secondMessage, {
				quick_replies: [
					{
						content_type: 'location',
					},
				],
			});
			break;
		case 'wantToType':
			await context.sendText(flow.wantToType.firstMessage);
			break;
		case 'wantToChange':
			await context.sendText(flow.wantToChange.firstMessage);
			await context.sendText(flow.wantToChange.secondMessage);
			break;
		case 'foundLocation':
			await context.sendText(flow.foundLocation.firstMessage);
			await context.sendText(flow.foundLocation.secondMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.foundLocation.menuOptions[0],
						payload: flow.foundLocation.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.foundLocation.menuOptions[1],
						payload: flow.foundLocation.menuPostback[1],
					},
				],
			});
			break;
		case 'nearestcouncil':
			await context.sendText(flow.nearestcouncil.firstMessage);
			await context.sendText(flow.nearestcouncil.secondMessage);
			await context.sendText(flow.nearestcouncil.thirdMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.nearestcouncil.menuOptions[0],
						payload: flow.nearestcouncil.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.nearestcouncil.menuOptions[1],
						payload: flow.nearestcouncil.menuPostback[1],
					},
				],
			});
			break;
		case 'wentAlready':
			await context.sendText(flow.wentAlready.firstMessage);
			// falls through
		case 'wentAlreadyMenu':
			await context.sendText(flow.wentAlready.secondMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.wentAlready.menuOptions[0],
						payload: flow.wentAlready.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.wentAlready.menuOptions[1],
						payload: flow.wentAlready.menuPostback[1],
					},
				],
			});
			break;
		case 'wannaKnowMembers':
			await context.sendText(flow.wannaKnowMembers.firstMessage);
			await context.sendText(flow.wannaKnowMembers.secondMessage);
			// falls through
		case 'councilMenu':
			await context.sendText(flow.councilMenu.firstMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.councilMenu.menuOptions[0],
						payload: flow.councilMenu.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.councilMenu.menuOptions[1],
						payload: flow.councilMenu.menuPostback[1],
					},
					{
						content_type: 'text',
						title: flow.councilMenu.menuOptions[2],
						payload: flow.councilMenu.menuPostback[2],
					},
				],
			});
			break;
		case 'mainMenu':
			await context.sendText(flow.mainMenu.firstMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.mainMenu.menuOptions[0],
						payload: flow.mainMenu.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.mainMenu.menuOptions[1],
						payload: flow.mainMenu.menuPostback[1],
					},
					{
						content_type: 'text',
						title: flow.mainMenu.menuOptions[2],
						payload: flow.mainMenu.menuPostback[2],
					},
				],
			});
			break;
		}
	}
});

const server = createServer(bot);

server.listen(process.env.API_PORT, () => {
	console.log(`Server is running on ${process.env.API_PORT} port...`);
	console.log(`App: ${process.env.APP} & Page: ${process.env.PAGE}`);
});
