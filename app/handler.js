const { MessengerHandler } = require('bottender');
const googleMapsClient = require('@google/maps').createClient({
	key: process.env.GOOGLE_MAPS_API_KEY,
	Promise,
});

const flow = require('./flow');
const attach = require('./attach');
// const location = require('./closest-location');

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

const conselhos = [
	{ council: 'CCS São Cristóvão', neighborhoods: 'Caju, Mangueira, São Cristóvão e Vasco da Gama' },
	{ council: 'CCS Barra do Piraí', neighborhoods: 'Barra do Piraí, Dorandia, Ipiabas, São José do Turvo e Vargem Alegre' },
	{ council: 'CCS Engenheiro Paulo de Frontin', neighborhoods: 'Engenheiro Paulo de Frontin e Sacra Família do Tinguá' },
	{ council: 'CCS Rio das Flores', neighborhoods: 'Rio das Flores, Manuel Duarte, Abarracamento e Taboas' },
	{ council: 'CCS AppCívico', neighborhoods: 'Paraíso, Ana Rosa, Brigadeiro e Vergueiro' },
];

let userDataArray = [];

function getNeighborhood(results) {
	let neighborhood = results.find(x => x.types.includes('political'));
	if (!neighborhood) { neighborhood = results.find(x => x.types.includes('sublocality')); }
	if (!neighborhood) { neighborhood = results.find(x => x.types.includes('sublocality_level_1')); }
	return neighborhood;
}
const timeLimit = 1000 * 60 * 60; // 60 minutes
const addressComplement = process.env.PROCESS_COMPLEMENT; // => "state, country"
const defaultAddress = process.env.DEFAULT_ADDRESS;
// context.state.geoLocation => the geolocation coordinates from the user
// context.state.address => the address the user types


module.exports = new MessengerHandler()
    .onEvent(async (context) => { // eslint-disable-line
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
					await context.resetState();
					// await context.setState({ dialog: 'greetings' });
					await context.setState({ dialog: 'whichCCSMenu' });
				} else {
					switch (context.state.dialog) {
					case 'retryType':
						// falls through
					case 'confirmLocation':
						// falls through
					case 'wantToType':
						// falls through
					case 'whichCCSMenu':
						// falls through
					case 'wantToChange':
						await context.setState({ address: context.event.message.text }); // what the user types is stored here
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
				await context.setState({ geoLocation: context.event.location.coordinates });
				await context.setState({ dialog: 'findLocation' });
			} else if (context.event.hasAttachment || context.event.isLikeSticker ||
                context.event.isFile || context.event.isVideo || context.event.isAudio ||
                context.event.isImage || context.event.isFallback) {
				await context.sendImage(flow.greetings.likeImage);
				await context.setState({ dialog: 'mainMenu' });
			}
			switch (context.state.dialog) {
			case 'greetings':
				await context.typingOn();
				await context.sendImage(flow.greetings.greetImage);
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
				await context.setState({ retryCount: 0 });
				// if we don't have a CCS linked to a user already we ask for it
				if (!context.state.CCS || !context.state.userLocation || !context.state.userLocation.neighborhood
                        || !context.state.userLocation.neighborhood.long_name) {
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
					await context.sendText(`${flow.whichCCS.remember} ${context.state.userLocation.neighborhood.long_name} ` +
                            `${flow.whichCCS.remember2} ${context.state.CCS.council}.`);
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
				await context.sendText(flow.sendLocation.secondMessage, { quick_replies: [{ content_type: 'location' }] });
				break;
			case 'wantToType':
				await context.sendText(flow.wantToType.firstMessage);
				break;
			case 'retryType':
				await context.sendText(flow.wantToChange.firstMessage);
				// falls through
			case 'wantToChange':
				await context.setState({ geoLocation: undefined });
				await context.setState({ userLocation: undefined });
				await context.setState({ retryCount: context.state.retryCount + 1 });
				// On the users 3rd try we offer him to either give up or send his location directly
				if (context.state.retryCount >= 3) {
					await context.setState({ retryCount: 0 });
					await context.sendText(`${flow.wantToChange.secondMessage.slice(0, -1)}\n${flow.wantToChange.helpMessage}`, {
						quick_replies: [
							{
								content_type: 'text',
								title: flow.wantToChange.menuOptions[0],
								payload: flow.wantToChange.menuPostback[0],
							},
							{
								content_type: 'text',
								title: flow.wantToChange.menuOptions[1],
								payload: flow.wantToChange.menuPostback[1],
							},
						],
					});
				} else {
					await context.sendText(flow.wantToChange.secondMessage);
				}
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
				if (!context.state.userLocation) {
					await context.setState({ userLocation: userDataArray.find(obj => obj.userId === context.session.user.id) });
					// console.log(context.state.userLocation.neighborhood.long_name);
				} // -----

				if (context.state.userLocation) {
					userDataArray = await userDataArray.filter(obj => obj.userId !== context.session.user.id);
					await context.setState({
						CCS: conselhos.find(obj => obj.neighborhoods.includes(context.state.userLocation.neighborhood.long_name)),
					});
					if (context.state.CCS) {
						await context.sendText(flow.nearestCouncil.firstMessage);
						await context.sendText(`${flow.nearestCouncil.secondMessage} ${context.state.CCS.council} ` +
                                `${flow.nearestCouncil.secondMessage2} ${context.state.CCS.neighborhoods}.`);
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
					} else {
						await context.sendText(`${flow.confirmLocation.noCouncil}.`);
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
				} else {
					await context.sendText(flow.confirmLocation.noFindGeo);
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
				await attach.sendCard(context, flow.subjects);
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
				await attach.sendCard(context, flow.results);
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
				await attach.sendCard(context, flow.followMedia);
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
			case 'findLocation': {
				await context.typingOn();
				googleMapsClient.reverseGeocode({
					latlng: [context.state.geoLocation.lat, context.state.geoLocation.long],
					language: 'pt-BR',
				}).asPromise().then(async (response) => {
					await userDataArray.push({
						userId: context.session.user.id,
						neighborhood: await getNeighborhood(response.json.results[0].address_components),
						address: response.json.results[0].formatted_address,
						geoLocation: response.json.results[0].geometry.location,
					});
					// await context.setState({ neighborhood: await getNeighborhood(response.json.results[0].address_components) });
					// await context.setState({ address: response.json.results[0].formatted_address });
					// await context.setState({ geoLocation: response.json.results[0].geometry.location });
					// await context.sendText(`${flow.confirmLocation.firstMessage}\n${context.state.address}`);
					await context.sendText(`${flow.confirmLocation.firstMessage}\n${response.json.results[0].formatted_address}`);
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
				}).catch(async (err) => {
					await context.typingOff();
					console.log('Couldn\'t get geolocation => ', err);
					await context.sendText(flow.confirmLocation.noFindGeo);
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
			case 'confirmLocation':
				await context.typingOn();
				googleMapsClient.geocode({
					address: `${context.state.address}, ${addressComplement}`,
					region: 'BR',
					language: 'pt-BR',
				}).asPromise().then(async (response) => {
					// console.log('results:');
					// console.dir(response.json.results[0].address_components);
					if (response.json.results[0].formatted_address.trim() !== defaultAddress) {
						await userDataArray.push({
							userId: context.session.user.id,
							neighborhood: await getNeighborhood(response.json.results[0].address_components),
							address: response.json.results[0].formatted_address,
							geoLocation: response.json.results[0].geometry.location,
						});
						// await context.setState({ neighborhood: await getNeighborhood(response.json.results[0].address_components) });
						// await context.setState({ address: response.json.results[0].formatted_address });
						// await context.setState({ geoLocation: response.json.results[0].geometry.location });
						// await context.sendText(`${flow.confirmLocation.firstMessage}\n${context.state.address}`);
						await context.sendText(`${flow.confirmLocation.firstMessage}\n${response.json.results[0].formatted_address}`);
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
	})
	.onError(async (context, err) => {
		const date = new Date();
		console.log('\n');
		console.log(`Parece que aconteceu um erro as ${date.toLocaleTimeString('pt-BR')} de ${date.getDate()}/${date.getMonth() + 1} =>`);
		console.log(err);
		console.log('\n');

		// await context.sendText('Parece que aconteceu um erro');
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
	});

