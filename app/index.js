require('dotenv').config();

const { MessengerBot, FileSessionStore } = require('bottender');
const { createServer } = require('bottender/restify');
const googleMapsClient = require('@google/maps').createClient({
	key: process.env.GOOGLE_MAPS_API_KEY,
	Promise,
});

// const postbacks = require('./postback');
const config = require('./bottender.config').messenger;
const flow = require('./flow');
const attach = require('./attach');
const location = require('./closest-location');

const cities = [
	['Sydney', -33.867487, 151.206990],
	['Brisbane', -27.471011, 153.023449],
	['Adelaide', -34.928621, 138.599959],
	['Eokoe', 23.572118, -46.644147],
];

const bot = new MessengerBot({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
	verifyToken: config.verifyToken,
	sessionStore: new FileSessionStore(),
});

const timeLimit = 1000 * 60 * 60; // 60 minutes
const addressComplement = process.env.PROCESS_COMPLEMENT; // => "state, country"
const defaultAddress = process.env.DEFAULT_ADDRESS;
// context.state.location => the geolocation coordinates from the user

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
			switch (context.event.quickReply.payload) {
			case 'notMe':
				await context.sendText(flow.aboutMe.notNow);
				await context.setState({ dialog: 'aboutMeMenu' });
				break;
			case 'notCCS':
				await context.sendText(flow.whichCCS.notNow);
				await context.setState({ dialog: 'whichCCSMenu' });
				break;
			case 'goBackMenu':
			// falls through
			case 'noLocation':
				await context.sendText(flow.mainMenu.notNow);
				await context.setState({ dialog: 'mainMenu' });
				break;
			case 'notWannaKnow':
				await context.sendText(flow.councilMenu.notNow);
				await context.setState({ dialog: 'councilMenu' });
				break;
			case 'neverWent':
				await context.sendText(flow.nearestCouncil.neverWent);
				await context.setState({ dialog: 'wentAlreadyMenu' });
				break;
			case 'facebook':
				await context.sendText(flow.userData.facebook);
				await context.setState({ dialog: 'userData' });
				break;
			default:
				await context.setState({ dialog: context.event.quickReply.payload });
				break;
			}
		} else if (context.event.isText) {
			if (context.event.message.text === process.env.RESTART) {
				await context.setState({ dialog: 'greetings' });
			} else {
				switch (context.state.dialog) {
				case 'confirmLocation':
					// falls through
				case 'wantToType':
					// falls through
				case 'whichCCSMenu':
					// falls through
				case 'wantToChange':
					await context.setState({ address: context.event.message.text });
					await context.setState({ dialog: 'confirmLocation' });
					break;
				case 'eMail':
					await context.setState({ eMail: context.event.message.text });
					await context.setState({ dialog: 'userData' });
					break;
				case 'whatsApp':
					await context.setState({ phone: context.event.message.text });
					await context.setState({ dialog: 'userData' });
					break;
				default: // regular text message
					await context.setState({ dialog: 'errorText' });
					break;
				}
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
			await context.sendImage(flow.whichCCS.CCSImage);
			await context.typingOff();
			// falls through
		case 'whichCCSMenu':
			if (!context.state.location) { // if we don't have a location already we ask for it
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
			} else {
				await context.sendText(flow.whichCCS.remember.replace('$nearest', context.state.address[0]));
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
			}
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
		case 'nearestCouncil':
			await context.setState({
				address: location.findClosest(
					context.state.location.lat,
					context.state.location.lng, cities,
				),
			});
			await context.sendText(flow.nearestCouncil.firstMessage);
			await context.sendText(flow.nearestCouncil.secondMessage.replace('$nearest', context.state.address[0]));
			await context.sendText(flow.nearestCouncil.thirdMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.nearestCouncil.menuOptions[0],
						payload: flow.nearestCouncil.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.nearestCouncil.menuOptions[1],
						payload: flow.nearestCouncil.menuPostback[1],
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
			await attach.sendCarousel(context, flow.wannaKnowMembers.carousel);
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
		case 'calendar':
			await context.sendText(flow.calendar.firstMessage);
			await context.sendText(flow.calendar.secondMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.calendar.menuOptions[0],
						payload: flow.calendar.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.calendar.menuOptions[1],
						payload: flow.calendar.menuPostback[1],
					},
					{
						content_type: 'text',
						title: flow.calendar.menuOptions[2],
						payload: flow.calendar.menuPostback[2],
					},
				],
			});
			break;
		case 'subjects':
			await context.sendText(flow.subjects.firstMessage);
			await context.sendButtonTemplate(flow.subjects.secondMessage, [{
				type: 'web_url',
				url: flow.subjects.pdfLink,
				title: flow.subjects.pdfName,
			}]);
			await context.sendText(flow.subjects.thirdMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.subjects.menuOptions[0],
						payload: flow.subjects.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.subjects.menuOptions[1],
						payload: flow.subjects.menuPostback[1],
					},
					{
						content_type: 'text',
						title: flow.subjects.menuOptions[2],
						payload: flow.subjects.menuPostback[2],
					},
				],
			});
			break;
		case 'results':
			await context.sendButtonTemplate(flow.results.firstMessage, [{
				type: 'web_url',
				url: flow.results.pdfLink,
				title: flow.results.pdfName,
			}]);
			await context.sendText(flow.results.secondMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.results.menuOptions[0],
						payload: flow.results.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.results.menuOptions[1],
						payload: flow.results.menuPostback[1],
					},
					{
						content_type: 'text',
						title: flow.results.menuOptions[2],
						payload: flow.results.menuPostback[2],
					},
				],
			});
			break;
		case 'join':
			await context.sendText(flow.join.firstMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.join.menuOptions[0],
						payload: flow.join.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.join.menuOptions[1],
						payload: flow.join.menuPostback[1],
					},
					{
						content_type: 'text',
						title: flow.join.menuOptions[2],
						payload: flow.join.menuPostback[2],
					},
					{
						content_type: 'text',
						title: flow.join.menuOptions[3],
						payload: flow.join.menuPostback[3],
					},
				],
			});
			break;
		case 'keepMe':
			await context.sendText(flow.keepMe.firstMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.keepMe.menuOptions[0],
						payload: flow.keepMe.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.keepMe.menuOptions[1],
						payload: flow.keepMe.menuPostback[1],
					},
					{
						content_type: 'text',
						title: flow.keepMe.menuOptions[2],
						payload: flow.keepMe.menuPostback[2],
					},
					{
						content_type: 'text',
						title: flow.keepMe.menuOptions[3],
						payload: flow.keepMe.menuPostback[3],
					},
				],
			});
			break;
		case 'share':
			await context.sendText(flow.share.firstMessage);
			await context.sendText(flow.share.shareButton);
			await context.sendText(flow.share.secondMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.share.menuOptions[0],
						payload: flow.share.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.share.menuOptions[1],
						payload: flow.share.menuPostback[1],
					},
				],
			});
			break;
		case 'followMedia':
			await context.sendButtonTemplate(flow.followMedia.firstMessage, [{
				type: 'web_url',
				url: flow.followMedia.pageLink,
				title: flow.followMedia.linkTitle,
			}]);
			// falls through
		case 'userData':
			await context.sendText(flow.userData.menuMessage, {
				quick_replies: [
					{
						content_type: 'text',
						title: flow.userData.menuOptions[0],
						payload: flow.userData.menuPostback[0],
					},
					{
						content_type: 'text',
						title: flow.userData.menuOptions[1],
						payload: flow.userData.menuPostback[1],
					},
				],
			});
			break;
		case 'eMail':
			await context.sendText(flow.userData.eMail);
			break;
		case 'whatsApp':
			await context.sendText(flow.userData.whatsApp);
			await context.sendText(flow.userData.phoneExample);
			break;
		case 'errorText':
			await context.sendButtonTemplate(`Oi, ${context.session.user.first_name} ${context.session.user.last_name}.${flow.error.noText}`, [{
				type: 'postback',
				title: flow.error.menuOptions[0],
				payload: flow.error.menuPostback[0],
			}]);
			break;
		case 'confirmLocation':
			await context.typingOn();
			googleMapsClient.geocode({
				address: `${context.state.address}, ${addressComplement}`,
				region: 'BR',
				language: 'pt-br',
			}).asPromise().then(async (response) => {
				// console.log(response.json.results[0]);
				if (response.json.results[0].formatted_address.trim() !== defaultAddress) {
					await context.setState({ address: response.json.results[0].formatted_address });
					await context.setState({ location: response.json.results[0].geometry.location });
					await context.sendText(`${flow.confirmLocation.firstMessage}\n${context.state.address}`);
					await context.typingOff();
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
				} else { // empty => falls into the default adress
					await context.sendText(`${flow.confirmLocation.noFirst} "${context.state.address}".`);
					await context.sendText(flow.confirmLocation.noSecond, {
						quick_replies: [
							{
								content_type: 'text',
								title: flow.confirmLocation.noOptions[0],
								payload: flow.confirmLocation.noPostback[0],
							},
							{
								content_type: 'text',
								title: flow.confirmLocation.noOptions[1],
								payload: flow.confirmLocation.noPostback[1],
							},
							{
								content_type: 'text',
								title: flow.confirmLocation.noOptions[2],
								payload: flow.confirmLocation.noPostback[2],
							},
						],
					});
				}
			}).catch(async (err) => {
				await context.typingOff();
				console.log(`Couldn't get geolocation => ${err}`);
				await context.sendText(`${flow.confirmLocation.noFirst} "${context.state.address}".`);
				await context.sendText(flow.confirmLocation.noSecond, {
					quick_replies: [
						{
							content_type: 'text',
							title: flow.confirmLocation.noOptions[0],
							payload: flow.confirmLocation.noPostback[0],
						},
						{
							content_type: 'text',
							title: flow.confirmLocation.noOptions[1],
							payload: flow.confirmLocation.noPostback[1],
						},
						{
							content_type: 'text',
							title: flow.confirmLocation.noOptions[2],
							payload: flow.confirmLocation.noPostback[2],
						},
					],
				});
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

process.on('SIGINT', () => { console.log('Bye bye!'); process.exit(); });
