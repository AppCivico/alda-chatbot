const googleMapsClient = require('@google/maps').createClient({
	key: process.env.GOOGLE_MAPS_API_KEY,
	Promise,
});

const moment = require('moment');

moment.locale('pt-BR');

const flow = require('./flow');
const attach = require('./attach');
const db = require('./DB_helper');
const help = require('./helpers');
// const postback = require('./postback');

let CCSBairros;
if (!global.TEST) {
	db.sequelize
		.authenticate()
		.then(async () => {
			console.log('Connection has been established successfully.');
			CCSBairros = await db.getCCS();
			CCSBairros.push({ // for send-location testing purposes
				ccs: 'CCS Eokoe', // the name of the CCS
				cod_ccs: 1087, // don't forget this
				status: 'Ativo',
				regiao: 'SP',
				municipio: 'Paraíso',
				bairro: 'Paraíso',
			});
			// CCSBairros.forEach((element) => { console.log(element); });
		}).catch((err) => {
			console.error('Unable to connect to the database:', err);
		});
}

const tempAuxObject = {}; // helps us store the value of the bairro somewhere because we can't setState inside of GoogleMaps Api callback
const phoneRegex = new RegExp(/^\+55\d{2}(\d{1})?\d{8}$/);


const timeLimit = 1000 * 60 * 60; // 60 minutes

// context.state.geoLocation => the geolocation coordinates from the user
// context.state.bairro => bairro found with GoogleMaps API or that the user typed
// context.state.otherBairros => bairros that also belong on same CCS
// context.state.CCS => object that stores the current CCS user belongs to (check CCS.Bairros.push() above)

module.exports = async (context) => {
	try {
		if (!context.event.isDelivery && !context.event.isEcho) {
			// console.dir(context.event);
			// console.dir(context.state);

			if ((context.event.rawEvent.timestamp - context.session.lastActivity) >= timeLimit) {
				if (context.session.user.first_name) { // check if first_name to avoid an 'undefined' value
					await context.sendText(`Olá, ${context.session.user.first_name}! ${flow.greetings.comeBack}`);
					await context.setState({ dialog: 'mainMenu' });
				} else {
					await context.sendText(`Olá! ${flow.greetings.comeBack}`);
					await context.setState({ dialog: 'mainMenu' });
				}
			} else if (context.event.isPostback) {
				if (context.event.postback.payload.slice(0, 6) === 'centro') { // from confirmCentro
					await context.setState({
						CCS: context.state.bairro.find(x => x.cod_ccs === parseInt(context.event.postback.payload.replace('centro', ''), 10)),
					});
					await context.setState({ dialog: 'confirmLocation' });
				} else {
					await context.setState({ dialog: context.event.postback.payload });
				}
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
				case 'nearestCouncil': // user confirmed this is the correct bairro from findLocation
					if (!context.state.bairro || tempAuxObject[context.session.user.id]) { // we still don't have a CCS found or data is still on the auxObject
						await context.setState({ bairro: tempAuxObject[context.session.user.id].long_name }); // saves obj-stored bairro-long-name on context
						delete tempAuxObject[context.session.user.id];
						console.log('bairro: ', context.state.bairro);
					} // ----- don't put an 'else' here

					if (context.state.bairro) { // check if bairro is centro
						if (context.state.bairro === 'Centro') { // test with Paraíso
							await context.setState({ dialog: 'confirmCentro' });
						} else {
							await context.setState({ CCS: await CCSBairros.find(obj => (obj.bairro.includes(context.state.bairro))) }); // load CCS from bairro
							await context.setState({ dialog: 'nearestCouncil' });
						}
					}
					break;
				case 'whichCCSMenu':
					// falls through
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
					await context.setState({ dialog: 'whichCCSMenu' });
				} else {
					switch (context.state.dialog) {
					case 'retryType':
						// falls through
					case 'confirmLocation':
						// falls through
					case 'sendLocation':
						// falls through
					case 'whichCCSMenu':
						// falls through
					case 'wantToChange':
					// falls through
					case 'wantToType1':
						await context.setState({ municipiosFound: await help.findCCSMunicipio(CCSBairros, context.event.message.text) });
						if (!context.state.municipiosFound) {
							await context.setState({ dialog: 'municipioNotFound' });
						} else {
							await context.setState({ dialog: 'wantToType2' });
						}
						break;
					case 'wantToType2':
						// await context.setState({ bairro: context.event.message.text }); // what the user types is stored here
						await context.setState({ bairro: await help.findCCSBairro(context.state.municipiosFound, context.event.message.text) });
						await context.setState({ municipiosFound: '' });
						if (!context.state.bairro) {
							await context.setState({ dialog: 'bairroNotFound' });
						} else if (context.state.bairro.length === 1) {
							await context.setState({ CCS: context.state.bairro[0] });
							await context.setState({ dialog: 'confirmLocation' });
						} else if (context.state.bairro[0].bairro === 'Centro') { // this means we are on bairro "centro"
							await context.setState({ dialog: 'confirmCentro' });
						}
						break;
					case 'eMail':
						await context.setState({ eMail: context.event.message.text });
						await context.setState({ dialog: 'userData' });
						break;
					case 'whatsApp':
						await context.setState({ phone: `+55${context.event.message.text.replace(/[- .)(]/g, '')}` });
						if (phoneRegex.test(context.state.phone)) { // valid phone
							await context.setState({ dialog: 'gotPhone' });
						} else { // invalid phone
							await context.setState({ phone: '', dialog: 'reAskPhone' });
						}
						break;
					default: // regular text message
						await context.setState({ dialog: 'errorText' });
						break;
					}
				}
			} else if (context.event.isLocation) { // received location so we can search for bairro
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
				await context.setState({ municipiosFound: '', bairro: '' });
				await context.sendImage(flow.greetings.greetImage);
				await context.sendText(flow.greetings.welcome);
				await context.typingOff();
				await context.sendText(flow.greetings.firstMessage, await attach.getQR(flow.greetings));
				break;
			case 'aboutMe':
				await context.sendText(flow.aboutMe.firstMessage);
				await context.sendText(flow.aboutMe.secondMessage);
				// falls through
			case 'aboutMeMenu':
				await context.sendText(flow.aboutMe.thirdMessage, await attach.getQR(flow.aboutMe));
				break;
			case 'whichCCS':
				await context.sendText(flow.whichCCS.firstMessage);
				await context.sendText(flow.whichCCS.secondMessage);
				await context.typingOn();
				await context.sendImage(flow.whichCCS.CCSImage);
				await context.typingOff();
				// falls through
			case 'whichCCSMenu': // asks user if he wants to find his CCS or confirm if we already have one stored
				// await context.setState({ municipiosFound: '', bairro: '' });
				await context.setState({ retryCount: 0 });
				// if we don't have a CCS linked to a user already we ask for it
				if (!context.state.CCS || !context.state.bairro) {
					await context.sendText(flow.whichCCS.thirdMessage, await attach.getQR(flow.whichCCS));
				} else {
					await context.sendText(`${flow.whichCCS.remember} ${context.state.bairro} ` +
					`${flow.whichCCS.remember2} ${context.state.CCS.ccs}.`);
					await context.sendText(flow.foundLocation.secondMessage, await attach.getQR(flow.foundLocation));
				}
				break;
			case 'sendLocation':
				await context.sendText(flow.sendLocation.firstMessage);
				await context.sendText(flow.sendLocation.secondMessage, { quick_replies: [{ content_type: 'location' }] });
				break;
			case 'retryType':
				await context.sendText(flow.wantToChange.firstMessage);
				// falls through
			case 'wantToType1': // asking for municipio
				await context.setState({ CCS: undefined, geoLocation: undefined, bairro: undefined });
				await context.setState({ retryCount: context.state.retryCount + 1 });
				// On the users 3rd try we offer him to either give up or send his location directly
				if (context.state.retryCount > 3) {
					await context.setState({ retryCount: 0 });
					await context.sendText(`${flow.wantToType.firstMessage}\n${flow.wantToChange.helpMessage}`, await attach.getQR(flow.wantToChange)); // TODO: Could this be a card?
				} else {
					await context.sendText(flow.wantToType.firstMessage);
				}
				break;
			case 'wantToType2': // asking for bairro
				await context.setState({ retryCount: 0 });
				await context.sendText(`Legal. Agora digite o bairro do município ${context.state.municipiosFound[0].regiao}`);
				break;
			case 'municipioNotFound':
				await context.sendText('Não consegui encontrar esse municipio. ' +
					'Deseja tentar novamente? Você pode pesquisar por Interior, Capital, Grande Niterói e Baixada Fluminense.', await attach.getQR(flow.notFoundMunicipio));
				break;
			case 'bairroNotFound':
				await context.sendText('Não consegui encontrar esse bairro. ' +
					'Quer tentar de novo? Você pode pesquisar por Copacabana, Centro, Ipanema e outros.', await attach.getQR(flow.notFoundBairro));
				break;
			case 'confirmCentro': {
				await context.sendText(`Parece que você quer saber sobre o Centro da Capital do Rio! Temos ${context.state.bairro.length} ` +
					'conselhos nessa região. Escolha qual dos seguintes complementos melhor se encaixa na sua região:');
				await attach.sendCentro(context, context.state.bairro);
				break; }
			case 'foundLocation':
				await context.sendText(flow.foundLocation.firstMessage);
				await context.sendText(flow.foundLocation.secondMessage, await attach.getQR(flow.foundLocation));
				break;
			case 'nearestCouncil': // we say/remind the user which CCS he's in and ask if he ever visited it before
				await context.setState({ otherBairros: await help.findBairrosByCod(CCSBairros, context.state.CCS.cod_ccs) }); // get other bairros on this ccs

				if (context.state.otherBairros.length === 1) { // check if there's more than one bairro on this ccs
					await context.sendText(`${flow.nearestCouncil.secondMessage} ${context.state.CCS.ccs} ` +
						`${flow.nearestCouncil.secondMessage3} ${context.state.otherBairros[0]}.`);
				} else if (context.state.otherBairros.length > 1) { // if there's more than one bairro we must list them appropriately
					await context.sendText(`${flow.nearestCouncil.secondMessage} ${context.state.CCS.ccs} ` +
						`${flow.nearestCouncil.secondMessage2} ${context.state.otherBairros.join(', ').replace(/,(?=[^,]*$)/, ' e')}.`);
				}
				if (context.state.CCS.status !== 'Ativo') { // check if ccs isn't active
					await context.sendText(`Infelizmente, o ${context.state.CCS.ccs} não se encontra em funcionamente na presente data. Deseja pesquisar outra localização?`, await attach.getQR(flow.notFoundBairro));
				} else { // ask user if he already went to one of the meetings
					await context.sendText(flow.nearestCouncil.thirdMessage, await attach.getQR(flow.nearestCouncil));
				}
				break;
			case 'wentAlready':
				await context.sendText(flow.wentAlready.firstMessage);
				// falls through
			case 'wentAlreadyMenu':
				await context.sendText(flow.wentAlready.secondMessage, await attach.getQR(flow.wentAlready));
				break;
			case 'wannaKnowMembers':
				await context.typingOn();
				await context.setState({ diretoria: await db.getDiretoria(context.state.CCS.cod_ccs) });
				await context.setState({ diretoriaAtual: [] });
				await context.state.diretoria.forEach((element) => { // check which members of the diretoria aren't active today
					if (Date.parse(element.fim_gestao) > new Date()) {
						context.state.diretoriaAtual.push(element);
					}
				});
				if (Object.keys(context.state.diretoriaAtual).length > 0) { // if there's at least one active member today we show the members(s)
					await context.sendText(`${flow.wannaKnowMembers.firstMessage} ${context.state.CCS.ccs} atualmente.`);
					await attach.sendCarousel(context, context.state.diretoriaAtual);
				} else { // if there's no active members we show the last 10 that became members (obs: 10 is the limit from elements in carousel)
					await context.sendText(`Não temos um conselho ativo atualmente para o ${context.state.CCS.ccs}.\nVeja quem já foi membro:`);
					await attach.sendCarousel(context, context.state.diretoria);
				}
				await context.setState({ diretoria: '', diretoriaAtual: '' }); // cleaning up
				await context.sendText(flow.wannaKnowMembers.secondMessage);
				// falls through
			case 'councilMenu':
				await context.sendText(flow.councilMenu.firstMessage, await attach.getQR(flow.councilMenu));
				await context.typingOff();
				break;
			case 'mainMenu':
				await context.sendText(flow.mainMenu.firstMessage, await attach.getQR(flow.mainMenu));
				break;
			case 'calendar':
				await context.typingOn();
				await context.setState({ calendario: await db.getCalendario(context.state.CCS.cod_ccs) });
				await context.sendText(`A próxima reunião do ${context.state.CCS.ccs} será ` +
					`${help.formatDate(moment, context.state.calendario[0].data_hora)} e vai acontecer no local ` +
					`${context.state.calendario[0].endereco}`); // TODO: review endereço (we are waiting for the database changes)
				await context.sendText(flow.calendar.secondMessage, await attach.getQR(flow.calendar));
				await context.typingOff();
				break;
			case 'subjects':
				await context.typingOn();
				await context.setState({ assuntos: await db.getAssuntos(context.state.CCS.cod_ccs) });
				if (context.state.assuntos.length === 0) {
					await context.sendText(flow.subjects.emptyAssuntos);
				} else { // TODO This will be updated to receive a link to a PDF
					await context.sendText(`${flow.subjects.firstMessage} ${context.state.assuntos.join('\n- ').replace(/,(?=[^,]*$)/, ' e')}.`);
				}
				// await context.sendText(flow.subjects.firstMessage);
				// await attach.sendCard(context, flow.subjects);
				await context.sendText(flow.subjects.thirdMessage, await attach.getQR(flow.subjects));
				await context.typingOff();
				break;
			case 'results':
				await attach.sendCard(context, flow.results);
				await context.sendText(flow.results.secondMessage, await attach.getQR(flow.results));
				break;
			case 'join':
				await context.sendText(flow.join.firstMessage, await attach.getQR(flow.join));
				break;
			case 'keepMe':
				await context.sendText(flow.keepMe.firstMessage, await attach.getQR(flow.keepMe));
				break;
			case 'share':
				await context.sendText(flow.share.firstMessage);
				await attach.sendShare(context, flow.share);
				await context.sendText(flow.share.secondMessage, await attach.getQR(flow.share));
				break;
			case 'followMedia':
				await attach.sendCard(context, flow.followMedia);
				// falls through
			case 'userData':
				await context.sendText(flow.userData.menuMessage, await attach.getQR(flow.userData));
				break;
			case 'eMail':
				await context.sendText(flow.userData.eMail);
				break;
			case 'reAskPhone':
				await context.sendText(flow.phone.firstMessage, await attach.getQR(flow.phone));
				break;
			case 'whatsApp':
				await context.sendText(flow.userData.whatsApp);
				await context.sendText(flow.userData.phoneExample);
				break;
			case 'gotPhone':
				await context.sendText('Guardamos seu telefone! Como posso te ajudar?', await attach.getQR(flow.userData));
				break;
			case 'errorText':
				await context.sendButtonTemplate(`Oi, ${context.session.user.first_name} ${context.session.user.last_name}.${flow.error.noText}`, [{
					type: 'postback',
					title: flow.error.menuOptions[0],
					payload: flow.error.menuPostback[0],
				}]);
				break;
			case 'findLocation': { // user sends location, we find the bairro using googleMaps and confirm at the end
				await context.typingOn();
				googleMapsClient.reverseGeocode({
					latlng: [context.state.geoLocation.lat, context.state.geoLocation.long],
					language: 'pt-BR',
				}).asPromise().then(async (response) => {
					// storing the bairro found
					tempAuxObject[context.session.user.id] = await help.getNeighborhood(response.json.results[0].address_components); // need to save the bairro found
					await context.typingOff(); // is this bairro correct? if so => nearestCouncil
					await context.sendText(`${flow.confirmLocation.firstMessage}\n${response.json.results[0].formatted_address}`);
					await context.sendText(flow.foundLocation.secondMessage, await attach.getQR(flow.foundLocation));
				}).catch(async (err) => { // an error ocorred
					await context.typingOff();
					await console.log('Couldn\'t get geolocation => ');
					await console.log(err);
					await context.sendText(flow.confirmLocation.noFindGeo);
					await context.sendText(flow.confirmLocation.noSecond, await attach.getQR(flow.notFound));
				});
				break;
			}
			} // dialog switch
		} // try
	} catch (err) {
		const date = new Date();
		console.log(`Parece que aconteceu um erro as ${date.toLocaleTimeString('pt-BR')} de ${date.getDate()}/${date.getMonth() + 1} =>`);
		console.log(err);
		console.log('\n');

		// await context.sendText('Parece que aconteceu um erro');
		await context.sendText(`Erro: ${flow.whichCCS.thirdMessage}`, await attach.getQR(flow.whichCCS));
	}
};


// municipio
// bairro
// centro => região
