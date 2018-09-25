const googleMapsClient = require('@google/maps').createClient({
	key: process.env.GOOGLE_MAPS_API_KEY,
	Promise,
});

const flow = require('./flow');
const attach = require('./attach');
const db = require('./DB_helper');
const help = require('./helpers');
const { sendAdminBroadcast } = require('./broadcast');

const tempAuxObject = {}; // helps us store the value of the bairro somewhere because we can't setState inside of GoogleMaps Api callback
const phoneRegex = new RegExp(/^\+55\d{2}(\d{1})?\d{8}$/);

const timeLimit = 1000 * 60 * 60 * 12; // 60 minutes * 12 hours => 1000 * 60 * 60 * 12

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
					await context.setState({ dialog: 'whichCCSMenu' });
				} else {
					await context.sendText(`Olá! ${flow.greetings.comeBack}`);
					await context.setState({ dialog: 'whichCCSMenu' });
				}
			} else if (context.event.isPostback) {
				if (context.event.postback.payload.slice(0, 6) === 'centro') { // from confirmCentro
					await context.setState({
						CCS: context.state.bairro.find(x => x.id === parseInt(context.event.postback.payload.replace('centro', ''), 10)),
					});
					await context.setState({ dialog: 'nearestCouncil' });
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
					} // ----- don't put an 'else' here

					if (context.state.bairro) { // check if bairro is centro
						if (context.state.bairro === 'Centro') { // test with Paraíso
							await context.setState({ dialog: 'confirmCentro' });
						} else {
							await context.setState({ CCS: await db.getCCSsFromBairro(context.state.bairro.toLowerCase()) }); // load CCS from bairro
							if (context.state.CCS && context.state.CCS.length !== 0) { // meaning we found a ccs on that bairro
								await context.setState({ CCS: context.state.CCS[0] }); // load CCS from bairro
								// db return an array and we grab the first object/bairro.
								await context.setState({ dialog: 'nearestCouncil' });
							} else {
								await context.setState({ dialog: 'notFoundFromGeo' });
							}
						}
					}
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
				if (context.event.message.text === process.env.RESTART) { // for quick testing
					// await context.resetState();
					// await context.setState({ dialog: 'whichCCSMenu' });
					// await context.setState({ dialog: 'councilMenu' });
					await context.setState({ dialog: 'join' });
				} else if (context.event.message.text === process.env.ADMIN_MENU) { // for the admin menu
					if (await help.checkUserOnLabel(context.session.user.id, process.env.LABEL_ADMIN) === true) { // check if user has label admin
						await context.setState({ dialog: 'adminStart', labels: '', isAdmin: '' });
					} else {
						await context.sendText('Vocẽ não é um administrador! Esse menu é proibido!');
						await context.setState({ dialog: 'whichCCSMenu', labels: '', isAdmin: '' });
					}
				} else {
					switch (context.state.dialog) {
					case 'retryType':
						// falls through
					case 'sendLocation':
						// falls through
					case 'whichCCSMenu':
						// falls through
					case 'wantToChange':
					// falls through
					case 'municipioNotFound':
					// falls through
					case 'wantToType1':
						await context.setState({ municipiosFound: await db.getCCSsFromMunicipio(context.event.message.text.toLowerCase()) });
						if (!context.state.municipiosFound || context.state.municipiosFound.length === 0) {
							await context.setState({ dialog: 'municipioNotFound' });
						} else {
							await context.setState({ dialog: 'wantToType2' });
						}
						break;
					case 'wantToType2':
					// TODO Make this better (Ver questão com usuário ter que digitar o nome completo do bairro)
						await context.setState({ bairro: await help.findCCSBairro(context.state.municipiosFound, context.event.message.text) });
						if (!context.state.bairro || context.state.bairro === 0) {
							await context.setState({ dialog: 'bairroNotFound' });
						} else if (context.state.bairro[0].bairro === 'Centro') { // this means we are on bairro "centro"
							await context.setState({ dialog: 'confirmCentro', municipiosFound: '' });
						} else if (context.state.bairro.length === 1) { // we found exactly one bairro with what was typed by the user
							await context.setState({ CCS: context.state.bairro[0] });
							await context.setState({ dialog: 'nearestCouncil', municipiosFound: '' });
						} // what happens if we find more than one bairro?
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
					case 'adminConfirm':
						await context.sendText('Escolha uma das opções!');
						break;
					case 'adminStart':
						await context.sendText('Escolha uma das opções!');
						break;
					case 'warnCalendar': // admin typed ccs number
						await context.setState({ broadcastNumber: await parseInt(context.event.message.text, 10) });
						// checking if number if valid and present on database
						if (Number.isInteger(context.state.broadcastNumber) && (context.state.broadcastNumber >= 1001 && context.state.broadcastNumber <= 1110)) {
							await context.setState({ CCSBroadcast: await db.getNamefromCCS(context.state.broadcastNumber) });
							if (context.state.CCSBroadcast) { // we found a CCS
								await context.sendText(`Encontrei o ${context.state.CCSBroadcast}. É esse conselho que você quer?`);
								await context.setState({ dialog: 'adminConfirm' });
							} else {
								await context.sendText(`Ops. Aconteceu um erro. Eu não consegui encontrar um CCS com ID ${context.state.broadcastNumber}. ` +
								'Tente Novamente. Se o erro persistir, entre em contato com nossa equipe.');
							}
						} else {
							await context.sendText('Número inválido. Tente novamente!');
						} // not changing dialog --> admin goes back to 'broadcast'
						break;
					case 'adminMessage':
						await context.setState({ broadcastText: context.event.message.text, dialog: 'adminConfirmText' });
						break;
					case 'metrics':
						await context.setState({ broadcastNumber: await parseInt(context.event.message.text, 10) });
						if (Number.isInteger(context.state.broadcastNumber)) { // check if it's integer
							await context.setState({ metrics: await help.getBroadcastMetrics(context.state.broadcastNumber) });
							if (context.state.metrics && context.state.metrics.data[0] && context.state.metrics.data[0].values) {
								await context.sendText(`Sucesso! Esse broadcast atingiu ${context.state.metrics.data[0].values[0].value} usuário(s).`);
							} else {
								await context.sendText('Não achamos nenhum broadcast com esse número! Tente novamente.');
							}
						} else {
							await context.sendText('Erro! Entrada inválida! Tente novamente.');
						} // after this flow we return to the metrics dialog
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
					await context.sendText(`${flow.whichCCS.remember} ${context.state.CCS.bairro} ` +
					`${flow.whichCCS.remember2} ${context.state.CCS.ccs}.`);
					await context.sendText(flow.foundLocation.secondMessage, await attach.getQR(flow.whichCCSMenu));
				}
				break;
			case 'sendLocation':
				await context.sendText(flow.sendLocation.firstMessage);
				await context.sendText(flow.sendLocation.secondMessage, { quick_replies: [{ content_type: 'location' }] });
				break;
			case 'wantToChange': // comes from sendLocation flow
				await context.setState({ geoLocation: undefined, bairro: undefined });
				await context.sendText(flow.wantToChange.firstMessage);
				await context.sendText(flow.wantToChange.secondMessage);
				break;
			case 'retryType': // comes from text flow
				await context.sendText(flow.wantToChange.firstMessage);
				// falls through
			case 'wantToType1': // asking for municipio
				await context.setState({ geoLocation: undefined, bairro: undefined });
				await context.setState({ retryCount: context.state.retryCount + 1 });
				// On the users 3rd try we offer him to either give up or send his location directly
				if (context.state.retryCount > 3) {
					await context.setState({ retryCount: 0 });
					await context.sendText(`${flow.wantToType.firstMessage}\n${flow.wantToChange.helpMessage}`, await attach.getQR(flow.wantToChange)); // TODO: Could this be a card?
				} else {
					await context.sendText(flow.wantToType.firstMessage);
					// await context.sendText(flow.wantToType.firstMessage); // change here
				}
				break;
			case 'wantToType2': // asking for bairro
				await context.setState({ retryCount: 0 });
				await context.setState({ sugestaoBairro: await help.listBairros(context.state.municipiosFound) }); // getting a set of random bairros to suggest to the user

				if (!context.state.sugestaoBairro && context.state.sugestaoBairro.length === 0) {
					await context.sendText(`Legal. Agora digite o bairro da cidade ${context.state.municipiosFound[0].regiao}.`);
				} else {
					await context.sendText(`Legal. Agora digite o bairro da cidade ${context.state.municipiosFound[0].regiao}. `
					+ `Você pode tentar bairros como ${context.state.sugestaoBairro.join(', ').replace(/,(?=[^,]*$)/, ' ou')}.`);
				}
				break;
			case 'municipioNotFound':
				await context.sendText('Não consegui encontrar essa cidade. ' +
					'Deseja tentar novamente? Você pode pesquisar por Interior, Capital, Grande Niterói e Baixada Fluminense.', await attach.getQR(flow.notFoundMunicipio));
				break;
			case 'bairroNotFound':
				await context.setState({ sugestaoBairro: await help.listBairros(context.state.municipiosFound) }); // getting a new set of random bairros
				await context.setState({ municipiosFound: '' });
				if (!context.state.sugestaoBairro && context.state.sugestaoBairro.length === 0) {
					await context.sendText(`Não consegui encontrar esse bairro na cidade ${context.state.municipiosFound[0].regiao}. ` +
					'Quer tentar de novo? ', await attach.getQR(flow.notFoundBairro));
				} else {
					await context.sendText(
						`Não consegui encontrar esse bairro na cidade ${context.state.municipiosFound[0].regiao}.\n` +
						`Quer tentar de novo? Exemplos de alguns bairros nesse municipio: ${context.state.sugestaoBairro.join(', ').replace(/,(?=[^,]*$)/, ' e')}.`,
						await attach.getQR(flow.notFoundBairro),
					);
				}
				break;
			case 'confirmCentro':
				await context.sendText(`Parece que você quer saber sobre o Centro da Capital do Rio! Temos ${context.state.bairro.length} ` +
					'conselhos nessa cidade. Escolha qual dos seguintes complementos melhor se encaixa na sua cidade:');
				await attach.sendCentro(context, context.state.bairro);
				break;
			case 'foundLocation': // are we ever using this?
				await context.sendText(flow.foundLocation.firstMessage);
				await context.sendText(flow.foundLocation.secondMessage, await attach.getQR(flow.foundLocation));
				break;
			case 'advance': // this is used for the CCS confirmation on whichCCSMenu
				// falls throught
			case 'nearestCouncil': // we say/remind the user which CCS he's in and ask if he ever visited it before
				await context.setState({ otherBairros: await db.getEveryBairro(context.state.CCS.id) }); // get other bairros on this ccs

				if (context.state.otherBairros.length === 1) { // check if there's more than one bairro on this ccs
					await context.sendText(`${flow.nearestCouncil.secondMessage} ${context.state.CCS.ccs} ` +
						`${flow.nearestCouncil.secondMessage3} ${context.state.otherBairros[0]}.`);
				} else if (context.state.otherBairros.length > 1) { // if there's more than one bairro we must list them appropriately
					await context.sendText(`${flow.nearestCouncil.secondMessage} ${context.state.CCS.ccs} ` +
						`${flow.nearestCouncil.secondMessage2} ${context.state.otherBairros.join(', ').replace(/,(?=[^,]*$)/, ' e')}.`);
				}
				if (context.state.CCS.status !== 'Ativo') { // check if ccs isn't active
					await context.sendText(`Infelizmente, o ${context.state.CCS.ccs} não se encontra em funcionamente na presente data. Deseja pesquisar outra localização?`, await attach.getQR(flow.notFoundBairro));
					// before adding the user+ccs on the table we check if it's already there
					if (await help.checkUserOnLabel(context.session.user.id, process.env.LABEL_BLACKLIST) !== true) { // check if user is not on the blacklist
						if (await db.checkNotificationAtivacao(context.session.user.id, context.state.CCS.id) !== true) {
							await db.addNotActive(context.session.user.id, context.state.CCS.id); // if it's not we add it
						}
					}
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
				await context.setState({ diretoria: await db.getDiretoria(context.state.CCS.id) }); // all the members of the the diretoria
				await context.setState({ diretoriaAtual: [] }); // stored active members on present date
				await context.state.diretoria.forEach((element) => { // check which members of the diretoria aren't active today
					if (Date.parse(element.fim_gestao) > new Date()) { context.state.diretoriaAtual.push(element); }
				});
				if (Object.keys(context.state.diretoriaAtual).length > 0) { // if there's at least one active member today we show the members(s)
					await context.sendText(`${flow.wannaKnowMembers.firstMessage} ${context.state.CCS.ccs} atualmente.`);
					await attach.sendCarousel(context, context.state.diretoriaAtual);
				} else { // if there's no active members we show the last 10 that became members (obs: 10 is the limit from elements in carousel)
					await context.sendText(`Não temos uma diretoria ativa atualmente para o ${context.state.CCS.ccs}.\nVeja quem já foi membro:`);
					await attach.sendCarousel(context, context.state.diretoria);
				}
				await context.setState({ diretoria: '', diretoriaAtual: '' }); // cleaning up
				await context.sendText(flow.wannaKnowMembers.secondMessage);
				// falls through
			case 'councilMenu': // "Escolha uma das opções"
				await context.sendText(flow.councilMenu.firstMessage, await attach.getQR(flow.councilMenu));
				await context.typingOff();
				break;
			case 'mainMenu':
				await context.sendText(flow.mainMenu.firstMessage, await attach.getQR(flow.mainMenu));
				break;
			case 'calendar': // agenda
				await context.typingOn();
				await context.setState({ agenda: await db.getAgenda(context.state.CCS.id) });
				if (context.state.agenda || context.state.agenda === null) { // check if we have an agenda to show
					await context.sendText(`Veja o que encontrei sobre a próxima reunião do ${context.state.CCS.ccs}:`);
					await context.sendText(`🗓️ *Data*: ${help.formatDate(context.state.agenda[0].create_at)}\n` +
						`🏠 *Local*: ${context.state.agenda[0].endereco}`); // TODO: review endereço (we are waiting for the database changes)
					await context.sendText(flow.calendar.secondMessage, await attach.getQR(flow.calendar));
					// before adding the user+ccs on the table we check if it's already there
					if (await help.checkUserOnLabel(context.session.user.id, process.env.LABEL_BLACKLIST) !== true) { // check if user is not on the blacklist
						if (await db.checkNotificationAgenda(context.session.user.id, context.state.agenda[0].id) !== true) {
							await db.addAgenda(
								context.session.user.id, context.state.agenda[0].id,
								context.state.agenda[0].endereco, context.state.agenda[0].create_at.toLocaleString(),
							); // if it's not we add it
						}
						// create an agendaLabel using CCS_ID because we don't know if there's a rate limit TODO change to agenda and delete it on the agenda timer
						await help.linkUserToAgendaLabel(`agenda${context.state.agenda[0].id}`, context.session.user.id);
					}
				} else {
					await context.sendText(`Não encontrei nenhuma reunião marcada para o ${context.state.CCS.ccs}.`, await attach.getQR(flow.calendar));
				}
				await context.typingOff();
				break;
			case 'subjects':
				await context.typingOn();
				await context.setState({ assuntos: await db.getAssuntos(context.state.CCS.id) });
				if (context.state.assuntos.length === 0) {
					await context.sendText(flow.subjects.emptyAssuntos);
				} else { // TODO This will be updated to receive a link to a PDF
					await context.sendText(`${flow.subjects.firstMessage} ${context.state.assuntos.join('\n- ').replace(/,(?=[^,]*$)/, ' e')}.`);
				}
				// await context.sendText(flow.subjects.firstMessage);
				// await attach.sendCardWithLink(context, flow.subjects);
				await context.sendText(flow.subjects.thirdMessage, await attach.getQR(flow.subjects));
				await context.typingOff();
				break;
			case 'results':
				await context.setState({ results: await db.getResults(context.state.CCS.id) });
				// if we don't have any results or if result is not a valid url we send this default message
				if (!context.state.results || context.state.results === null || (await help.urlExists(context.state.results)) === false) {
					await context.sendText(`Parece que o ${context.state.CCS.ccs} ainda não disponibilizou seus resultados mais recentes!`);
				} else {
					await context.sendText('Disponibilizamos o resultado da ultima reunião em um arquivo que você pode baixar clicando abaixo.');
					await attach.sendCardWithLink(context, flow.results, context.state.results);
				}
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
				await attach.sendCardWithLink(context, flow.followMedia, flow.followMedia.link);
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
					await context.sendText(`${flow.foundLocation.firstMessage}\n${response.json.results[0].formatted_address}`);
					await context.sendText(flow.foundLocation.secondMessage, await attach.getQR(flow.foundLocation));
				}).catch(async (err) => { // an error ocorred
					await context.typingOff();
					await console.log('Couldn\'t get geolocation => ');
					await console.log(err);
					await context.sendText(flow.foundLocation.noFindGeo);
					await context.sendText(flow.foundLocation.noSecond, await attach.getQR(flow.notFound));
				});
				break; }
			case 'notFoundFromGeo':
				await context.sendText(
					`Não encontrei nenhum conselho no bairro ${context.state.bairro}. Quer tentar novamente?`,
					await attach.getQR(flow.whichCCS),
				);
				break;
			case 'adminStart': // Admin flow ----------------------------------------------
				await context.sendText('Bem-vindo ao painel de administrador do bot! Muito cuidado por aqui!\nO que deseja fazer?', await attach.getQR(flow.adminStart));
				break;
			case 'warnCalendar':
				await context.sendText('Ok! Aqui você poderá enviar uma mensagem para todos os usuários que visualizaram a agenda de um conselho.' +
					'\nDigite apenas o número (id) do conselho desejado, entre 1001 e 1110. Por exemplo: O CCS Casimiro de Abreu é o 1031 e o CCS AISP 27 é o 1011.', await attach.getQR(flow.warnCalendar));
				break;
			case 'adminConfirm':
				await context.setState({ broadcastAgenda: await db.getAgenda(context.state.broadcastNumber) });
				if (context.state.broadcastAgenda[0]) { // check if we have an agenda for this CCS
					if (context.state.broadcastAgenda[0].create_at && context.state.broadcastAgenda[0].create_at !== '' && context.state.broadcastAgenda[0].endereco && context.state.broadcastAgenda[0].endereco !== '') {
						await context.sendText(`Temos uma reunião marcada nesse CCS em ${help.formatDate(context.state.broadcastAgenda[0].create_at)} no ${context.state.broadcastAgenda[0].endereco}`);
					} else { // check if the values have been updated on the database already
						await context.sendText(`Temos uma reunião marcada nesse CCS que parece ter sido cancelada em ${help.formatDate(context.state.broadcastAgenda[0].updated_at)}`);
					}
					await context.sendText('Isso está correto? Podemos continuar?', await attach.getQR(flow.adminConfirm1));
				} else {
					await context.sendText('Não encontrei nenhuma agenda nesse CCS. Tente novamente ou entre em contato!', await attach.getQR(flow.adminConfirm2));
					await context.setState({ dialog: 'broadcast' });
				}
				break;
			case 'adminMessage':
			// here we need to check if there's any entry in notificacao_agenda that matches the ccs
				await context.setState({ notification_agenda: await db.getAgendaNotificationFromID(context.state.broadcastAgenda[0].id) });
				console.log(context.state.notification_agenda);

				if (!context.state.notification_agenda) { // error
					await context.setState({ dialog: '', notification_agenda: '', broadcastAgenda: '', broadcastNumber: '', CCSBroadcast: '' }); // eslint-disable-line object-curly-newline
					await context.sendText('Ocorreu um erro ao pesquisar agendas! Tente novamente ou entre em contato!', await attach.getQR(flow.adminConfirm2));
				} else if (context.state.notification_agenda.length === 0) { // no user will be notified if there's zero notification_agenda
					await context.setState({ dialog: '', notification_agenda: '', broadcastAgenda: '', broadcastNumber: '', CCSBroadcast: '' }); // eslint-disable-line object-curly-newline
					await context.sendText('Não encontrei nenhuma notificação para essa agenda! Isso quer dizer que desde que a reunião foi marcada ninguém pesquisou por ela. Que pena!', await attach.getQR(flow.adminConfirm2));
				} else if (context.state.notification_agenda.length === 1) {
					await context.sendText(`Tudo bem! Escreva sua mensagem abaixo, ela será enviada apenas para ${context.state.notification_agenda.length} usuário. ` +
					'Antes de envia-la, iremos mostrar como ela ficou e confirmar seu envio.', await attach.getQR(flow.adminConfirm2));
				} else {
					await context.sendText(`Tudo bem! Escreva sua mensagem abaixo, ela será enviada para ${context.state.notification_agenda.length} usuários. ` +
					'Antes de envia-la, iremos mostrar como ela ficou e confirmar seu envio.', await attach.getQR(flow.adminConfirm2));
				}
				break;
			case 'adminConfirmText':
				await context.sendText('Sua mensagem aparecerá assim:');
				await context.sendText(context.state.broadcastText);
				await context.sendText('Podemos envia-la?', await attach.getQR(flow.adminConfirmText));
				break;
			case 'broadcastSent': {
				await context.sendText('OK, estamos enviando...');
				const result = await sendAdminBroadcast(context.state.broadcastText, `agenda${context.state.notification_agenda[0].agendas_id}`);

				if (result.broadcast_id) {
					await context.sendText(`Enviamos o broadcast ${result.broadcast_id} com sucesso.`, await attach.getQR(flow.broadcastSent));
				} else {
					await context.sendText(`Ocorreu um erro, avise nossos desenvolvedores => ${result.message}`, await attach.getQR(flow.broadcastSent));
				}
				await context.setState({ dialog: '', notification_agenda: '', broadcastAgenda: '', broadcastNumber: '', CCSBroadcast: '' }); // eslint-disable-line object-curly-newline
				break; }
			case 'metrics':
				await context.sendText(
					'Insira o id do broadcast que você deseja. Exemplo: 332286104187677. Esse id é dado depois que você envia um broadcast. ' +
					'Se for um broadcast que você acabou de enviar recomendamos esperar alguns minutos para ter o resultado correto). ',
					await attach.getQR(flow.metrics),
				);
				break;
			case 'disableNotifications': // Notifications flow ----------------------------------------------
				if (await help.dissociateLabelsFromUser(context.session.user.id)) { // remove every label from user
					await help.addUserToBlackList(context.session.user.id); // add user to the 'blacklist'
					await context.sendText('Tudo bem. Não estarei mais te enviando nenhuma notificação.', await attach.getQR(flow.notificationDisable));
				}
				break;
			case 'enableNotifications':
				if (await help.removeUserFromBlackList(context.session.user.id)) { // remove blacklist label from user
					await context.sendText('Legal! Estarei te interando das novidades!', await attach.getQR(flow.notificationDisable));
				}
				break;
			} // dialog switch
		} // try
	} catch (err) {
		const date = new Date();
		console.log(`Parece que aconteceu um erro as ${date.toLocaleTimeString('pt-BR')} de ${date.getDate()}/${date.getMonth() + 1} =>`);
		console.log(err);
		console.log('\n');

		await context.sendText(' Ops. Tive um erro interno. Tente novamente.');
		await context.sendText(flow.whichCCS.thirdMessage, await attach.getQR(flow.whichCCS));


		// await context.sendText(`Erro: ${flow.whichCCS.thirdMessage}`, await attach.getQR(flow.whichCCS));
	}
};
