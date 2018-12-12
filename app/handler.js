const googleMapsClient = require('@google/maps').createClient({
	key: process.env.GOOGLE_MAPS_API_KEY,
	Promise,
});

const flow = require('./flow');
const attach = require('./attach');
const db = require('./DB_helper');
const metric = require('./DB_metrics');
const help = require('./helpers');
const events = require('./events'); // eslint-disable-line
const { Sentry } = require('./helpers'); // eslint-disable-line
const { sendAdminBroadcast } = require('./broadcast');

const { restartList } = require('./helpers');

const phoneRegex = new RegExp(/^\+55\d{2}(\d{1})?\d{8}$/);
const mailRegex = new RegExp(/\S+@\S+/);

const timeLimit = 1000 * 60 * 60 * 24 * 3; // 60 minutes * 24 hours  * 3 days => 1000 * 60 * 60 * 24 * 3
const calendarQROpt = [flow.subjectsOpt, flow.resultsOpt, flow.joinOpt];

async function checkMenu(CCSID, oldOptions) {
	// cheking which quick_reply options we can show in the menu
	// { quick_replies: await checkMenu(context, [flow.calendarOpt, flow.subjectsOpt, flow.resultsOpt, flow.joinOpt]) }
	// each flow._opt passed will be added to the final options if it's present and matches the requirements (like having an agenda to show subjects)
	const options = [];
	if (oldOptions.find(obj => obj.payload === 'calendar')) { options.push(flow.calendarOpt); }
	if (oldOptions.find(obj => obj.payload === 'subjects')) { // before checking the database we can check if we would have sent this optins in the first pplace
		const agenda = await db.getAgenda(CCSID); // getting agenda to check if we should send "subjects" option
		if (agenda && help.dateComparison(agenda.data) >= help.dateComparison(new Date())) { // we can send it
			options.push(flow.subjectsOpt);
		}
	}
	if (oldOptions.find(obj => obj.payload === 'results')) {
		const resuts = await db.getResults(CCSID); // check if we have a valid text to send
		if (resuts && resuts.texto && resuts.texto.length > 0 && resuts.texto.length <= 2000) {
			options.push(flow.resultsOpt); // we can send it
		}
	}
	if (oldOptions.find(obj => obj.payload === 'join')) { options.push(flow.joinOpt); }
	return options;
}

async function sendCouncilMenu(context) {
	if (!context.state.CCS) { // Quer saber sobre o Conselho mais próximo de você?
		await context.sendText(flow.whichCCS.thirdMessage, await attach.getQR(flow.whichCCS));
	} else { // "Escolha uma das opções"
		await context.sendText(
			flow.councilMenu.firstMessage,
			{ quick_replies: await checkMenu(context.state.CCS.id, [flow.calendarOpt, flow.subjectsOpt, flow.resultsOpt, flow.joinOpt]) },
		);
		await metric.userAddOrUpdate(context);
	}
	await context.typingOff();
	await events.addCustomAction(context.session.user.id, 'Usuario no Menu do Conselho');
}

async function sendGreetings(context) {
	await context.typingOn();
	await context.sendImage(flow.greetings.greetImage);
	await context.sendText(flow.greetings.welcome);
	await context.typingOff();
	await context.sendText(flow.greetings.firstMessage, await attach.getQR(flow.greetings));
	await metric.userAddOrUpdate(context);
}

module.exports = async (context) => {
	if (!context.event.isDelivery && !context.event.isEcho) {
		try {
			if ((context.event.rawEvent.timestamp - context.session.lastActivity) >= timeLimit) {
				if (context.session.user.first_name) { // check if first_name to avoid an 'undefined' value
					await context.sendText(`Olá, ${context.session.user.first_name}! ${flow.greetings.comeBack}`);
					await context.setState({ dialog: 'whichCCSMenu' });
				} else {
					await context.sendText(`Olá! ${flow.greetings.comeBack}`);
					await context.setState({ dialog: 'whichCCSMenu' });
				}
			} else if (context.event.isPostback) {
				if (context.event.postback.payload.slice(0, 9) === 'confirmBa') { // from confirmBairro
					await context.setState({
						CCS: context.state.bairro.find(x => x.id === parseInt(context.event.postback.payload.replace('confirmBa', ''), 10)),
					});
					await context.setState({ dialog: 'nearestCouncil', asked: false });
				} else if (context.event.postback.payload.slice(0, 9) === 'confirmMu') { // from confirmMunicipio
					await context.setState({
						CCS: context.state.municipiosFound.find(x => x.id === parseInt(context.event.postback.payload.replace('confirmMu', ''), 10)),
					});
					await context.setState({ dialog: 'nearestCouncil', asked: false });
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
				case 'preNearestCouncil': // came from geo
					await events.addCustomAction(context.session.user.id, 'Resultado certo da localizacao');
					await context.setState({ cameFromGeo: true }); // saves the name of the bairro from googleMaps
					// falls through
				case 'nearestCouncil': // user confirmed this is the correct bairro from findLocation/GEO
					await context.setState({ mapsResults: '' });
					if (!context.state.CCSGeo || context.state.CCSGeo === null || context.state.CCSGeo.length === 0) {
						await context.setState({ dialog: 'notFoundFromGeo' });
					} else if (context.state.CCSGeo.length === 1) {
						await context.setState({ CCS: context.state.CCSGeo[0] });
						await context.setState({ dialog: 'nearestCouncil', asked: false });
					} else { // more than one bairro was found
						await context.sendText(`Hmm, encontrei ${context.state.CCSGeo.length} bairros na minha pesquisa. 🤔 `
                + 'Me ajude a confirmar qual bairro você quer escolhendo uma das opções abaixo. ');
						await attach.sendConselhoConfirmation(context, context.state.CCSGeo);
						await context.setState({ dialog: 'confirmBairro', bairro: context.state.CCSGeo });
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
					if (await metric.checkChatbotUser(context.session.user.id) === true) { await metric.updateWentBeforeChatbotUser(context.session.user.id, false); }
					await context.setState({ dialog: 'wentAlreadyMenu' });
					break;
				case 'facebook':
					await context.sendText(flow.userData.facebook);
					await context.setState({ dialog: 'userData' });
					break;
				case 'checkBairroFromGeo': // check centro and colegio
					await context.setState({ municipiosFound: await db.getCCSsFromMunicipio('rio de janeiro'), theBairro: await help.formatString(context.state.mapsBairro) });

					if ('centro'.includes(context.state.theBairro)) { // special case: check if user wants to know about centro on capital
						await context.setState({ bairro: await help.findBairroCCSID(context.state.municipiosFound, 'centro') });
						await context.sendText(`Encontrei ${context.state.bairro.length} conselhos no bairro ${context.state.bairro[0].bairro} na cidade `
                + `${context.state.municipiosFound[0].municipio}. 📍 Escolha qual dos seguintes complementos melhor se encaixa na sua região:`);
						await attach.sendCentroConfirmation(context, context.state.bairro);
						await context.setState({ dialog: 'confirmBairro' });
					} else if ('colegio'.includes(context.state.theBairro)) { // special case: check if user wants to know about colegio on capital
						await context.setState({ bairro: await help.findBairroCCSID(context.state.municipiosFound, 'colegio') });
						await context.sendText(`Encontrei ${context.state.bairro.length} conselhos no bairro ${context.state.bairro[0].bairro} na cidade `
                + `${context.state.municipiosFound[0].municipio}. Para que eu encontre o conselho certo, escolha a delegacia de Polícia mais próxima a sua casa:`);
						await attach.sendColegioConfirmation(context, context.state.bairro);
						await context.setState({ dialog: 'confirmBairro' });
					}
					break;
				default:
					await context.setState({ dialog: context.event.quickReply.payload });
					break;
				}
			} else if (context.event.isText) {
				if (!context.state.dialog) { // in case a user manages to send a text message without starting the dialog properly
					await context.setState({ dialog: 'greetings' });
				} else if (context.event.message.text === process.env.RESTART) { // for quick testing
					// await context.setState({ dialog: 'whichCCSMenu' });
					// await context.setState({ dialog: 'councilMenu' });
					await context.setState({ dialog: 'calendar' });
				} else if (context.event.message.text === process.env.ADMIN_MENU) { // for the admin menu
					if (await help.checkUserOnLabel(context.session.user.id, process.env.LABEL_ADMIN) === true) { // check if user has label admin
						await context.setState({ dialog: 'adminStart', labels: '', isAdmin: '' });
					} else {
						await context.sendText('Vocẽ não é um administrador! Esse menu é proibido!');
						await context.setState({ dialog: 'whichCCSMenu', labels: '', isAdmin: '' });
					}
				} else if (restartList.includes(await help.formatString(context.event.message.text))) {
					await context.setState({ dialog: 'greetings' });
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
					case 'confirmMunicipio':
						// falls through
					case 'nearestCouncil':
						// falls through
					case 'wantToType1': // user entered city text
						await context.setState({ cameFromGeo: false });
						await context.setState({ userInput: await help.formatString(context.event.message.text) }); // format user input
						if (context.state.userInput.length < 3) { // input limit (3 because we can leave 'rio' as an option)
							await context.sendText('Esse nome é muito curto! Desse jeito não conseguirei encontrar sua cidade. Por favor, tente de novo.');
							await context.setState({ dialog: 'wantToType1' });
						} else if ('rio de janeiro'.includes(context.state.userInput) || 'capital'.includes(context.state.userInput)) { // special case: 'rio de janeiro' or 'capital'
							await context.setState({ municipiosFound: await db.getCCSsFromMunicipio('rio de janeiro') });
							await context.setState({ dialog: 'wantToType2' });
						} else {
							await context.setState({ municipiosFound: await db.getCCSsFromMunicipio(context.state.userInput) });

							if (!context.state.municipiosFound || context.state.municipiosFound.length === 0) {
								await context.setState({ dialog: 'municipioNotFound' });
							} else if (context.state.municipiosFound.length === 1) { // we found exactly one municipio with what was typed by the user
								await context.setState({ CCS: context.state.municipiosFound[0] });
								await context.setState({ dialog: 'nearestCouncil', asked: false });
							} else { // more than one municipio was found
								await context.sendText(`Hmm, encontrei ${context.state.municipiosFound.length} municípios na minha pesquisa. 🤔 `
                    + 'Me ajude a confirmar qual municípios você quer escolhendo uma das opções abaixo. ');
								await attach.sendMunicipioConfirmation(context, context.state.municipiosFound);
								await context.setState({ dialog: 'confirmMunicipio' });
							}
						} // else text length
						break;
					case 'bairroNotFound':
						// falls through
					case 'confirmBairro':
						// falls through
					case 'wantToType2': // user entered bairro text
						await context.setState({ cameFromGeo: false });
						await context.setState({ userInput: await help.formatString(context.event.message.text) }); // format user input
						if (context.state.userInput.length < 4) { // input limit  (4 because the shortest bairros have 4)
							await context.sendText('Esse nome é muito pequeno! Assim não consigo achar seu bairro. Por favor, tente outra vez.');
							await context.setState({ dialog: 'wantToType2' });
						} else if (context.state.municipiosFound[0].municipio.toLowerCase() === 'rio de janeiro' && 'centro'.includes(context.state.userInput)) { // special case: check if user wants to know about centro on capital
							await context.setState({ bairro: await help.findBairroCCSID(context.state.municipiosFound, 'centro') });
							await context.sendText(`Encontrei ${context.state.bairro.length} conselhos no bairro ${context.state.bairro[0].bairro} na cidade `
                  + `${context.state.municipiosFound[0].municipio}. 📍 Escolha qual dos seguintes complementos melhor se encaixa na sua região:`);
							await attach.sendCentroConfirmation(context, context.state.bairro);
							await context.setState({ dialog: 'confirmBairro' });
						} else if (context.state.municipiosFound[0].municipio.toLowerCase() === 'rio de janeiro' && 'colegio'.includes(context.state.userInput)) { // special case: check if user wants to know about colegio on capital
							await context.setState({ bairro: await help.findBairroCCSID(context.state.municipiosFound, 'colegio') });
							await context.sendText(`Encontrei ${context.state.bairro.length} conselhos no bairro ${context.state.bairro[0].bairro} na cidade `
                  + `${context.state.municipiosFound[0].municipio}. Para que eu encontre o conselho certo, escolha a delegacia de Polícia mais próxima a sua casa:`);
							await attach.sendColegioConfirmation(context, context.state.bairro);
							await context.setState({ dialog: 'confirmBairro' });
						} else { // regular case
							await context.setState({ bairro: await help.findCCSBairro(context.state.municipiosFound, context.state.userInput) });
							if (!context.state.bairro || context.state.bairro === null || context.state.bairro.length === 0) {
								await context.setState({ dialog: 'bairroNotFound' });
							} else if (context.state.bairro.length === 1) { // we found exactly one bairro with what was typed by the user
								await context.setState({ CCS: context.state.bairro[0] });
								await context.setState({ dialog: 'nearestCouncil', asked: false });
							} else { // more than one bairro was found
								await context.sendText(`Hmm, encontrei ${context.state.bairro.length} bairros na minha pesquisa. 🤔 `
                    + 'Me ajude a confirmar qual bairro você quer escolhendo uma das opções abaixo. ');
								await attach.sendConselhoConfirmation(context, context.state.bairro);
								await context.setState({ dialog: 'confirmBairro' });
							}
						}
						break;
					case 'reAskMail':
						// falls throught
					case 'eMail':
						await context.setState({ eMail: context.event.message.text.toLowerCase() });
						if (mailRegex.test(context.state.eMail)) { // valid mail
							await context.sendText('Obrigada por fazer parte! Juntos podemos fazer a diferença. ❤️');
							await context.setState({ dialog: 'userData' });
							await events.addCustomAction(context.session.user.id, 'Usuario deixou e-mail com sucesso');
							await metric.updateMailChatbotUserNoCCS(context.session.user.id, context.state.eMail);
						} else { // invalid email
							await context.setState({ eMail: '', dialog: 'reAskMail' });
							await events.addCustomAction(context.session.user.id, 'Usuario nao conseguiu deixar e-mail');
						}
						break;
					case 'reAskPhone':
						// falls throught
					case 'whatsApp':
						await context.setState({ phone: `+55${context.event.message.text.replace(/[- .)(]/g, '')}` });
						if (phoneRegex.test(context.state.phone)) { // valid phone
							await context.setState({ dialog: 'gotPhone' });
							await events.addCustomAction(context.session.user.id, 'Usuario deixou fone com sucesso');
							await metric.updatePhoneChatbotUserNoCCS(context.session.user.id, context.state.phone);
						} else { // invalid phone
							await context.setState({ phone: '', dialog: 'reAskPhone' });
							await events.addCustomAction(context.session.user.id, 'Usuario nao conseguiu deixar fone');
						}
						break;
					case 'adminConfirm':
						await context.sendText('Escolha uma das opções!');
						break;
					case 'adminStart':
						await context.sendText('Escolha uma das opções!');
						break;
					case 'broadcast':
						await context.setState({ cameFromBroadcast: true }); // check if admin is sending a general broadcast
						// falls throught
					case 'warnCalendar': // admin typed ccs number
						await context.setState({ broadcastNumber: await parseInt(context.event.message.text, 10) });
						// checking if number if valid and present on database
						if (Number.isInteger(context.state.broadcastNumber) && (context.state.broadcastNumber >= 1001 && context.state.broadcastNumber <= 1110)) {
							await context.setState({ CCSBroadcast: await db.getNamefromCCS(context.state.broadcastNumber) });

							if (context.state.CCSBroadcast) { // we found a CCS
								await context.sendText(`Encontrei o ${context.state.CCSBroadcast}.`);
								if (context.state.cameFromBroadcast === true) {
									await context.sendText('Isso está correto? Podemos continuar?', await attach.getQR(flow.confirmCCS));
									await context.setState({ dialog: '' });
								} else {
									await context.setState({ dialog: 'adminConfirm' });
								}
							} else {
								await context.sendText(`Ops. Aconteceu um erro. Eu não consegui encontrar um CCS com ID ${context.state.broadcastNumber}. `
                    + 'Tente Novamente. Se o erro persistir, entre em contato com nossa equipe.');
							}
						} else {
							await context.sendText('Número inválido. Tente novamente!');
						} // not changing dialog --> admin goes back to 'warnCalendar'
						break;
					case 'writeMessage':
						// falls throught
					case 'agendaMessage':
						await context.setState({ broadcastText: context.event.message.text, dialog: 'agendaConfirmText' });
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
					default: // regular text message => error treatment
						await context.setState({ lastDialog: context.state.dialog });
						await context.sendText(`Oi, ${context.session.user.first_name}. Eu sou a Alda, uma robô 🤖 e não entendi essa sua útlima mensagem.`
                + '\nPosso te pedir um favor? Me diga o que você quer fazer clicando em uma das opções abaixo. ⬇️ '
                + '\nSe quiser voltar para onde estava, clique em \'Voltar.\'', await attach.getErrorQR(flow.error, context.state.lastDialog));
						await context.setState({ dialog: '' });
						await events.addCustomAction(context.session.user.id, 'Texto nao interpretado');
						// await context.setState({ dialog: 'errorText' });
						break;
					}
				}
			} else if (context.event.isLocation) { // received location so we can search for bairro
				await context.setState({ geoLocation: context.event.location.coordinates });
				await context.setState({ dialog: 'findLocation' });
				await events.addCustomAction(context.session.user.id, 'Usuario envia localizacao');
			} else if (context.event.hasAttachment || context.event.isLikeSticker
        || context.event.isFile || context.event.isVideo || context.event.isAudio
        || context.event.isImage || context.event.isFallback) {
				await context.sendImage(flow.greetings.likeImage);
				await context.setState({ dialog: 'mainMenu' });
			}
			switch (context.state.dialog) {
			case 'start':
				await sendGreetings(context);
				await events.addCustomAction(context.session.user.id, 'Usuario comeca dialogo');
				break;
			case 'greetings':
				await sendGreetings(context);
				await events.addCustomAction(context.session.user.id, 'Usuario ve Saudacoes');
				break;
			case 'aboutMe':
				await context.sendText(flow.aboutMe.firstMessage);
				await context.sendText(flow.aboutMe.secondMessage);
				await events.addCustomAction(context.session.user.id, 'Usuario quer saber mais Alda');
				// falls through
			case 'aboutMeMenu':
				await context.sendText(flow.aboutMe.thirdMessage, await attach.getQR(flow.aboutMe));
				break;
			case 'whichCCS':
				await context.typingOn();
				await context.sendText(flow.whichCCS.firstMessage);
				await context.sendText(flow.whichCCS.secondMessage);
				await context.sendImage(flow.whichCCS.CCSImage);
				await events.addCustomAction(context.session.user.id, 'Usuario quer saber mais CCS');
				await context.typingOff();
				// falls through
			case 'whichCCSMenu': // asks user if he wants to find his CCS or confirm if we already have one stored
				await context.setState({ retryCount: 0 });
				// if we don't have a CCS linked to a user already we ask for it

				if (!context.state.CCS || !context.state.CCS.ccs) { // Quer saber sobre o Conselho mais próximo de você?
					await context.sendText(flow.whichCCS.thirdMessage, await attach.getQR(flow.whichCCS));
					await events.addCustomAction(context.session.user.id, 'Pedimos Conselho ao Usuario');
				} else { // Pelo que me lembro
					await context.sendText(`${flow.whichCCS.remember} ${await help.getRememberComplement(context.state.CCS)} `
              + `${flow.whichCCS.remember2} ${context.state.CCS.ccs}.`);
					await context.sendText(flow.foundLocation.secondMessage, await attach.getQR(flow.whichCCSMenu));
					await events.addCustomAction(context.session.user.id, 'Lembramos Usuario do seu Conselho');
				}
				break;
			case 'sendLocation':
				await context.sendText(flow.sendLocation.firstMessage);
				await context.sendText('Ao clicar no botão, um mapa da sua localização atual aparecerá. Você poderá mover o cursor e dar zoom para ajustar a localização, caso necessário.');
				await context.sendText(flow.sendLocation.secondMessage, await attach.getQRLocation(flow.sendLocation));
				break;
			case 'wantToChange': // comes from sendLocation flow
				await context.setState({ geoLocation: undefined });
				await context.sendText(flow.wantToChange.firstMessage); // Ih, errei. Me ajuda, então?
				await context.sendText(flow.wantToChange.secondMessage);
				break;
			case 'retryType': // comes from text flow
				await context.sendText('Tudo bem. Vamos encontrar o conselho mais adequado para sua região.');
				// falls through
			case 'wantToType1': // asking for municipio
				await context.setState({ geoLocation: undefined, bairro: undefined });
				await context.setState({ retryCount: context.state.retryCount + 1 });
				// On the users 3rd try we offer him to either give up or send his location directly
				if (context.state.retryCount > 3) {
					await context.setState({ retryCount: 0 });
					await context.sendText(`${flow.wantToType.firstMessage}\n${flow.wantToChange.helpMessage}`, await attach.getQR(flow.wantToChange));
				} else {
					await context.sendText(flow.wantToType.firstMessage); // Digite a cidade do Rio de Janeiro que você gostaria de ver.
				}
				await events.addCustomAction(context.session.user.id, 'Pedimos Cidade ao Usuario');

				break;
			case 'wantToType2': // asking for bairro
				await context.setState({ retryCount: 0 });
				await context.setState({ unfilteredBairros: await help.listBairros(context.state.municipiosFound) }); // getting a set of random bairros to suggest to the user
				await context.setState({
					sugestaoBairro: await context.state.unfilteredBairros.filter((item, pos, self) => self.indexOf(item) === pos),
				}); // get other bairros on this ccs
				if (!context.state.sugestaoBairro || context.state.sugestaoBairro.length === 0) {
					await context.sendText('Legal. Agora digite o *bairro* da cidade Rio de Janeiro.');
				} else {
					await context.sendText('Legal. Agora digite o *bairro* da cidade Rio de Janeiro. '
              + `Você pode tentar bairros como ${context.state.sugestaoBairro.join(', ')} e outros.`);
				}
				await events.addCustomAction(context.session.user.id, 'Pedimos Bairro ao Usuario');
				break;
			case 'municipioNotFound':
				await context.sendText('Não consegui encontrar essa cidade. Deseja tentar novamente?', await attach.getQR(flow.notFoundMunicipio));
				await events.addCustomAction(context.session.user.id, 'Não encontramos Cidade');
				break;
			case 'bairroNotFound': // from wantToType2, couldn't find any bairros with what the user typed
				await context.setState({ sugestaoBairro: await help.listBairros(context.state.municipiosFound) }); // getting a new set of random bairros
				if (!context.state.sugestaoBairro || context.state.sugestaoBairro.length === 0) { // check if we have random bairros to list
					await context.sendText('Não consegui encontrar esse bairro da cidade Rio de Janeiro. '
              + 'Vamos tentar de novo? Digite o *bairro* que deseja.', await attach.getQR(flow.notFoundBairro));
				} else {
					await context.sendText(
						'Não consegui encontrar esse bairro da cidade Rio de Janeiro.\nQuer tentar de novo? '
              + `Digite o *bairro* que deseja. Exemplos de alguns bairros nessa cidade: ${context.state.sugestaoBairro.join(', ')} e outros.`,
						await attach.getQR(flow.notFoundBairro),
					);
				}
				await events.addCustomAction(context.session.user.id, 'Não encontramos Bairro');
				break;
			case 'foundLocation': // are we ever using this?
				await context.sendText(flow.foundLocation.firstMessage);
				await context.sendText(`${flow.foundLocation.secondMessage}`, await attach.getQR(flow.foundLocation));
				break;
			case 'advance': // this is used for the CCS confirmation on whichCCSMenu
				// falls throught
			case 'nearestCouncil': // we say/remind the user which CCS he's in and ask if he ever visited it before
				// link user to the correspondent ccs_tag
				if (await help.checkUserOnLabel(context.session.user.id, process.env.LABEL_BLACKLIST) !== true) { // check if user is not on the blacklist
					await help.linkUserToCustomLabel(`ccs${context.state.CCS.id}`, context.session.user.id);
				}

				await metric.userAddOrUpdate(context);
				await context.setState({ unfilteredBairros: await db.getEveryBairro(context.state.CCS.id) }); // get other bairros on this ccs
				await context.setState({
					otherBairros: await context.state.unfilteredBairros.filter((item, pos, self) => self.indexOf(item) === pos),
				}); // get other bairros on this ccs
				if (context.state.otherBairros.length === 1) { // check if there's more than one bairro on this ccs. "Então, o Conselho mais próximo de você é o"
					await context.sendText(`${flow.nearestCouncil.secondMessage} *${context.state.CCS.ccs}* `
              + `${flow.nearestCouncil.secondMessage3} ${context.state.otherBairros[0]}.`);
				} else if (context.state.otherBairros.length > 1) { // if there's more than one bairro we must list them appropriately
					await context.sendText(`${flow.nearestCouncil.secondMessage} *${context.state.CCS.ccs}* `
              + `${flow.nearestCouncil.secondMessage2} ${context.state.otherBairros.join(', ').replace(/,(?=[^,]*$)/, ' e')}.`);
				}
				if (context.state.CCS.status !== 'Ativo') { // check if ccs isn't active
					await context.sendText(
						`Infelizmente, o ${context.state.CCS.ccs} não se encontra em funcionamente na presente data. Deseja pesquisar outra localização?`,
						await attach.getConditionalQR([flow.notFoundBairro, flow.notFoundBairroFromGeo], context.state.cameFromGeo),
					);
					// before adding the user+ccs on the table we check if it's already there
					if (await help.checkUserOnLabel(context.session.user.id, process.env.LABEL_BLACKLIST) !== true) { // check if user is not on the blacklist
						if (await db.checkNotificationAtivacao(context.session.user.id, context.state.CCS.id) !== true) {
							await db.addNotActive(context.session.user.id, context.state.CCS.id); // if it's not we add it
						}
					}
				} else if (context.state.asked === 'abcTest') {
					await context.sendText(flow.nearestCouncil.thirdMessage, await attach.getQR(flow.nearestCouncil));
					// await context.sendText('O que deseja saber do seu conselho?', await attach.getQR(flow.councilMenu));
				} else { // ask user if he already went to one of the meetings
					// await context.setState({ asked: true }); // Você já foi em alguma reunião do seu Conselho?
					await context.sendText(flow.nearestCouncil.thirdMessage, await attach.getQR(flow.nearestCouncil));
				}
				await events.addCustomAction(context.session.user.id, 'Econtramos-Confirmamos Conselho');
				break;
			case 'wentAlready':
				await context.sendText(flow.wentAlready.firstMessage);
				if (await metric.checkChatbotUser(context.session.user.id) === true) { await metric.updateWentBeforeChatbotUser(context.session.user.id, true); }
				await events.addCustomAction(context.session.user.id, 'Usuario foi em uma reuniao anteriormente');
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
					await attach.sendCarouselDiretoria(context, context.state.diretoriaAtual);
				} else { // if there's no active members we show the last 10 that became members (obs: 10 is the limit from elements in carousel)
					await context.sendText(`Não temos uma diretoria ativa atualmente para o ${context.state.CCS.ccs}.\nVeja quem já foi membro:`);
					await attach.sendCarouselDiretoria(context, context.state.diretoria);
				}
				await context.setState({ diretoria: '', diretoriaAtual: '', mapsResults: '' }); // cleaning up
				await events.addCustomAction(context.session.user.id, 'Usuario ve Diretoria');

				// checking if user has either searchedBairro or searcherCity to find the membros_natos
				if ((context.state.CCS.bairro && context.state.CCS.bairro.length > 0) || (context.state.CCS.municipio && context.state.CCS.municipio.length > 0)) {
					await context.typingOn();
					if (context.state.CCS.bairro && context.state.CCS.bairro.length > 0) {
						await context.setState({ membrosNatos: await db.getMembrosNatosBairro(context.state.CCS.bairro, context.state.CCS.id) });
					} else if ((context.state.CCS.municipio && context.state.CCS.municipio.length > 0)) {
						await context.setState({ membrosNatos: await db.getMembrosNatosMunicipio(context.state.CCS.municipio, context.state.CCS.id) });
					}

					if (context.state.membrosNatos && context.state.membrosNatos.length !== 0) { // check if there was any results
						await setTimeout(async (membrosNatos) => {
							await context.sendText(flow.wannaKnowMembers.secondMessage);
							await attach.sendCarouselMembrosNatos(context, membrosNatos);
							await context.sendText(flow.wannaKnowMembers.thirdMessage);
							await sendCouncilMenu(context);
							await context.typingOff();
						}, 5000, context.state.membrosNatos);
						await context.setState({ membrosNatos: '' }); // cleaning up
					} else { // no membrosNatos
						await sendCouncilMenu(context);
					}
				} else { // no searchedBairro or searchedCity
					await sendCouncilMenu(context);
				}
				break;
			case 'mainMenu': // 'Veja como eu posso te ajudar por aqui'
				await context.sendText(flow.mainMenu.firstMessage, await attach.getQR(flow.mainMenu));
				break;
			case 'councilMenu': // 'Escolha uma das opções:'
				await context.setState({ mapsResults: '' });
				await sendCouncilMenu(context);
				break;
			case 'calendar': // agenda
				await context.typingOn();
				await context.setState({ agenda: await db.getAgenda(context.state.CCS.id) });

				if (context.state.agenda) { // check if we have an agenda to show
					if (help.dateComparison(context.state.agenda.data) >= help.dateComparison(new Date())) { // check if next reunion is going to happen today or after today
						await context.sendText(`Veja o que encontrei sobre a próxima reunião do ${context.state.CCS.ccs}:`);
						await context.setState({ ageMsg: await help.getAgendaMessage(context.state.agenda) });
						await context.sendText(context.state.ageMsg);
						await context.setState({ ageMsg: '' });
						// sending menu options
						await context.setState({ QROptions: await checkMenu(context.state.CCS.id, calendarQROpt) });
						if (context.state.QROptions.find(obj => obj.payload === 'results') && context.state.QROptions.find(obj => obj.payload === 'subjects')) { // check if we can send results and subjects (this whole part is necessary because the text changes)
							await context.sendText(flow.calendar.preMenuMsg, { quick_replies: context.state.QROptions });
						} else { // send text for no results
							await context.sendText(flow.calendar.preMenuMsgExtra, { quick_replies: context.state.QROptions });
						}

						if (await help.checkUserOnLabel(context.session.user.id, process.env.LABEL_BLACKLIST) !== true) { // check if user is not on the blacklist !==
							// before adding the user+ccs on the table we check if it's already there
							if (await db.checkNotificationAgenda(context.session.user.id, context.state.agenda.id) !== true) { // !== true
								await db.addAgenda(
									context.session.user.id, context.state.agenda.id, `${context.state.agenda.endereco}, ${context.state.agenda.bairro ? context.state.agenda.bairro : ''}`,
									new Date(`${context.state.agenda.data} ${context.state.agenda.hora}`).toLocaleString(),
								); // if it's not we add it
							}
							await help.linkUserToCustomLabel(`agenda${context.state.agenda.id}`, context.session.user.id); // create an agendaLabel using agenda_id
						}
					} else { // last reunion already happened
						await context.sendText('Ainda não tem uma reunião agendada para o seu CCS. A última que aconteceu foi no dia '
                + `${help.formatDateDay(context.state.agenda.data)}.`);
						if (await help.checkUserOnLabel(context.session.user.id, process.env.LABEL_BLACKLIST) !== true) { // check if user is not on the blacklist !==
							await context.sendText('Assim que aparecer uma nova data aqui para mim, eu te aviso! 😉', { quick_replies: await checkMenu(context.state.CCS.id, calendarQROpt) });
							// before adding the user+ccs on the table we check if it's already there
							if (await db.checkNovaAgenda(context.session.user.id, context.state.agenda.id) !== true) { // !== true
								await db.addNovaAgenda(context.session.user.id, context.state.agenda.id); // if it's not we add it
							}
							await help.linkUserToCustomLabel(`agenda${context.state.agenda.id}`, context.session.user.id); // create an agendaLabel using agenda_id
						} else { // User is on the blacklist
							await context.setState({ QROptions: await checkMenu(context.state.CCS.id, calendarQROpt) });
							if (context.state.QROptions.find(obj => obj.payload === 'results')) { // check if we can send results (this whole part is necessary because the text changes)
								await context.sendText('Você pode ver os nossos últimos resultados clicando abaixo! 😊', { quick_replies: await checkMenu(context.state.CCS.id, calendarQROpt) });
							} else { // send text for no results
								await context.sendText(flow.calendar.preMenuMsgExtra, { quick_replies: context.state.QROptions });
							}
						}
					}
				} else { // no agenda at all, probably an error
					await context.sendText(`Não encontrei nenhuma reunião marcada para o ${context.state.CCS.ccs}.`);
					await context.sendText('Fique por dentro das nossas novidades e ajude-nos a crescer clicando em "Fazer Parte".', { quick_replies: await checkMenu(context.state.CCS.id, calendarQROpt) });
				}
				await context.typingOff();
				await events.addCustomAction(context.session.user.id, 'Usuario ve Agenda');
				break;
			case 'subjects':// on results we have to check if there is a valid result so that we can show the result
				await context.typingOn();
				await context.setState({ assuntos: await db.getAssuntos(context.state.CCS.id) });
				if (!context.state.assuntos || context.state.assuntos.length === 0) { // no subjects so we show the standard ones
					// checking if there is an agenda for this ccs so we can show the standard subjects every reunion tends to have
					await context.setState({ agenda: await db.getAgenda(context.state.CCS.id) });
					// check if we have an agenda to show and if next reunion is going to happen today or after today
					if (context.state.agenda && help.dateComparison(context.state.agenda.data) >= help.dateComparison(new Date())) {
						await context.sendText(`${flow.subjects.firstMessage} \n- ${['Leitura e Aprovação da ATA anterior',
							'Comunicações Diversas', 'Assuntos Administrativos'].join('\n- ').replace(/,(?=[^,]*$)/, ' e')}.`);
					} else { // no agenda today or after so NO subjects at all
						await context.sendText('Infelizmente, ainda não tem uma reunião agendada para o seu CCS. Não sabemos que assuntos serão discutidos na próxima reunião. ');
						await context.sendText('Fique por dentro das nossas novidades e ajude-nos a crescer clicando em "Fazer Parte".', await attach.getQR(flow.subjects));
					}
				} else { // sending the bullet point list with the subjects
					await context.sendText(`${flow.subjects.firstMessage} \n- ${context.state.assuntos.join('\n- ').replace(/,(?=[^,]*$)/, ' e')}.`);
				}
				// sending menu options
				await context.setState({ QROptions: await checkMenu(context.state.CCS.id, [flow.calendarOpt, flow.resultsOpt, flow.joinOpt]) });
				if (context.state.QROptions.find(obj => obj.payload === 'results')) { // check if we can send results (this whole part is necessary because the text changes)
					await context.sendText(flow.subjects.preMenuMsg, { quick_replies: context.state.QROptions });
				} else { // send text for no results
					await context.sendText(flow.subjects.preMenuMsgExtra, { quick_replies: context.state.QROptions });
				}

				await context.typingOff();
				await events.addCustomAction(context.session.user.id, 'Usuario ve Assuntos');
				break;
			case 'results': // on results we have to check if there is a future agenda so that we can show the subjects
				await context.typingOn();
				// If we have an agenda but no results for that agenda we show the results from the most recent agenda (see query)
				await context.setState({ results: await db.getResults(context.state.CCS.id), sent: false });
				// check if we have a valid text to send
				if (context.state.results && context.state.results.texto && context.state.results.texto.length > 0 && context.state.results.texto.length <= 2000) {
					await context.setState({ resultTexts: await help.separateString(context.state.results.texto) });
					if (context.state.resultTexts && context.state.resultTexts.firstString) {
						await context.sendText(`Em resumo, o que discutimos foi o seguinte:\n${context.state.resultTexts.firstString}`);

						if (context.state.resultTexts.secondString) {
							await context.sendText(context.state.resultTexts.secondString);
						}
					}
					await context.setState({ sent: true });
				}
				if (context.state.results && context.state.results.link_download
					&& await help.urlExists(context.state.results.link_download) === true) { // check if link exists and is valid
					await context.sendText(`Disponibilizamos o resultado da última reunião do dia ${help.formatDateDay(context.state.results.data)} `
					+ 'no arquivo que você pode baixar clicando abaixo. 👇');
					await attach.sendCardWithLink(context, flow.results, context.state.results.link_download);
					await context.setState({ sent: true });
				}

				if (context.state.sent === false) { // in case we couldn't send neither the text nor the link
					await context.sendText(`Parece que o ${context.state.CCS.ccs} ainda não utiliza o formato de ata eletrônica. Que tal sugerir à diretoria do seu Conselho? 🙂`);
				}
				await context.setState({ sent: '' });

				// sending menu options
				await context.setState({ QROptions: await checkMenu(context.state.CCS.id, [flow.calendarOpt, flow.subjectsOpt, flow.joinOpt]) });
				if (context.state.QROptions.find(obj => obj.payload === 'subjects')) { // check if we can send subjects (this whole part is necessary because the text changes)
					await context.sendText(flow.results.preMenuMsg, { quick_replies: context.state.QROptions });
				} else { // send text for no subjects
					await context.sendText(flow.results.preMenuMsgExtra, { quick_replies: context.state.QROptions });
				}

				await context.typingOff();
				await events.addCustomAction(context.session.user.id, 'Usuario ve Resultados');
				break;
			case 'join':
				await context.sendText(flow.join.firstMessage, await attach.getQR(flow.join));
				await events.addCustomAction(context.session.user.id, 'Usuario quer fazer parte');
				break;
			case 'keepMe':
				await context.sendText(flow.keepMe.firstMessage, await attach.getQR(flow.keepMe));
				await events.addCustomAction(context.session.user.id, 'Usuario quer manter-se informado');
				break;
			case 'share':
				await context.sendText(flow.share.firstMessage);
				await attach.sendShare(context, flow.share);
				await context.sendText(flow.share.secondMessage, await attach.getQR(flow.share));
				await events.addCustomAction(context.session.user.id, 'Usuario quer compartilhar');
				break;
			case 'followMedia':
				await context.sendText(flow.followMedia.firstMessage);
				await attach.sendCardWithLink(context, flow.followMedia, flow.followMedia.link);
				await context.sendText(flow.followMedia.secondMessage, await attach.getQR(flow.followMedia));
				await events.addCustomAction(context.session.user.id, 'Usuario quer seguir redes sociais');
				break;
			case 'userData':
				await context.sendText(flow.userData.menuMessage, await attach.getQR(flow.userData));
				break;
			case 'eMail':
				await context.sendText(flow.userData.eMail);
				break;
			case 'reAskMail':
				await context.sendText(flow.eMail.firstMessage, await attach.getQR(flow.eMail));
				break;
			case 'whatsApp':
				await context.sendText(flow.userData.whatsApp);
				await context.sendText(flow.userData.phoneExample);
				break;
			case 'reAskPhone':
				await context.sendText(flow.phone.firstMessage, await attach.getQR(flow.phone));
				break;
			case 'gotPhone':
				await context.sendText('Guardamos seu telefone! Como posso te ajudar?', await attach.getQR(flow.userData));
				break;
				// GeoLocation/GoogleMaps flow ---------------------------------------------------------------------------
			case 'findLocation': { // user sends geolocation, we find the bairro using googleMaps and confirm at the end
				await context.setState({ municipiosFound: undefined, bairro: undefined });

				await context.typingOn();
				try {
					await context.setState({
						mapsResults: await googleMapsClient.reverseGeocode({
							latlng: [context.state.geoLocation.lat, context.state.geoLocation.long],
							language: 'pt-BR',
						}).asPromise(),
					});
					if (context.state.mapsResults.status === 200) {
						await context.setState({ mapsResults: context.state.mapsResults.json.results });
						await help.getCityFromGeo(context.state.mapsResults);
						if (await help.checkIfInRio(context.state.mapsResults) === true) { // we are in rio
							await context.setState({ mapsCity: await help.getCityFromGeo(context.state.mapsResults) });
							if (!context.state.mapsCity) {
								await context.sendText(flow.foundLocation.noFindGeo); // Desculpe, não consegui encontrar nenhum endereço. Parece que um erro aconteceu
								await context.sendText(flow.foundLocation.noSecond, await attach.getQR(flow.notFound));
							} else if (context.state.mapsCity.toLowerCase() === 'rio de janeiro') {
								await context.setState({ mapsBairro: await help.getNeighborhood(context.state.mapsResults[0].address_components) });
								await context.setState({ mapsResults: '' });
								if (context.state.mapsBairro) {
									if (context.state.mapsBairro.toLowerCase() === 'centro' || context.state.mapsBairro.toLowerCase() === 'colégio') {
										// await await context.setState({ mapsBairro: 'Centro' }); // for testing, we can change the above conditional to !== 'centro'
										await context.sendText(`Hmm, você está querendo saber sobre o bairro ${context.state.mapsBairro} na Capital do Rio? 🤔`, await attach.getQR(flow.checkBairro));
										// confirmation here sends user to 'checkBairroFromGeo'
									} else { // not colegio nor centro
										await context.setState({ CCSGeo: await db.getCCSsFromBairroExact(await help.formatString(context.state.mapsBairro)) });
										await context.sendText(`Encontrei o bairro ${context.state.mapsBairro} na cidade ${context.state.mapsCity}.`);
										await context.sendText(flow.foundLocation.secondMessage, await attach.getQRLocation2(flow.foundLocation));
										// confirmation here sends user to 'nearestCouncil'
									}
								} else { // error on mapsBairro
									await context.sendText(flow.foundLocation.noFindGeo); // Desculpe, não consegui encontrar nenhum endereço. Parece que um erro aconteceu.
									await context.sendText(flow.foundLocation.noSecond, await attach.getQR(flow.notFound));
									await events.addCustomAction(context.session.user.id, 'Erro com a localizacao');
								}
							} else { // not rio de janeiro
								await context.typingOff(); // is this bairro correct? if so => nearestCouncil // Podemos seguir ou você quer alterar o local?
								await context.setState({ CCSGeo: await db.getCCSsFromMunicipio(await help.formatString(context.state.mapsCity)) });
								await context.sendText(`${flow.foundLocation.firstMessage} ${context.state.mapsCity}`);
								await context.sendText(flow.foundLocation.secondMessage, await attach.getQRLocation2(flow.foundLocation));
							}
						} else { // not in rio
							await context.sendText('Parece que você não se encontra no Rio de Janeiro. Nossos conselhos de segurança atuam apenas no Estado do Rio de Janeiro. '
							+ 'Por favor, entre com outra localização ou digite sua região.', await attach.getQRLocation(flow.geoMenu));
							await events.addCustomAction(context.session.user.id, 'Usuario-Geo Nao esta no RJ');
						}
					} else { // unexpected response from googlemaps api
						await context.sendText(flow.foundLocation.noFindGeo);
						await context.sendText(flow.foundLocation.noSecond, await attach.getQRLocation(flow.geoMenu));
						await events.addCustomAction(context.session.user.id, 'Erro com a localizacao');
					}
				} catch (error) {
					console.log('Error at findLocation => ', error);
					await context.sendText(flow.foundLocation.noFindGeo);
					await context.sendText(flow.foundLocation.noSecond, await attach.getQRLocation(flow.geoMenu));
					await events.addCustomAction(context.session.user.id, 'Erro com a localizacao');
					throw error;
				}
				// });
				break;
			}
			case 'notFoundFromGeo':
				await context.sendText(
					'Não encontrei nenhum conselho no local em questão. '
            + 'Quer tentar novamente?',
					await attach.getQRLocation(flow.geoMenu),
				);
				break;
				// Admin flow ---------------------------------------------------------------------------
			case 'adminStart':
				await context.setState({ cameFromBroadcast: '' });
				await context.sendText('Bem-vindo ao painel de administrador do bot! Muito cuidado por aqui!\nO que deseja fazer?', await attach.getQR(flow.adminStart));
				break;
			case 'warnCalendar':
				await context.setState({ cameFromBroadcast: '' });
				await context.sendText('Ok! Aqui você poderá enviar uma mensagem para todos os usuários que visualizaram a agenda de um conselho.'
            + '\nDigite apenas o número (id) do conselho desejado, entre 1001 e 1110. Por exemplo: O CCS Casimiro de Abreu é o 1031 e o CCS AISP 27 é o 1011.', await attach.getQR(flow.warnCalendar));
				break;
			case 'adminConfirm':
				await context.setState({ broadcastAgenda: await db.getAgenda(context.state.broadcastNumber) });
				if (context.state.broadcastAgenda) { // check if we have an agenda for this CCS
					if (context.state.broadcastAgenda.data && context.state.broadcastAgenda.data !== ''
              && context.state.broadcastAgenda.endereco && context.state.broadcastAgenda.endereco !== '') {
						await context.sendText(`Temos uma reunião marcada nesse CCS em *${help.formatDate(context.state.broadcastAgenda.data)}* `
                + `em *${context.state.broadcastAgenda.endereco}*.`);
					} else { // check if the values have been updated on the database already
						await context.sendText(`Temos uma reunião marcada nesse CCS que parece ter sido cancelada em ${help.formatDate(context.state.broadcastAgenda.updated_at)}`);
					}
					await context.sendText('Isso está correto? Podemos continuar?', await attach.getQR(flow.agendaConfirm1));
				} else {
					await context.sendText('Não encontrei nenhuma agenda nesse CCS. Tente novamente ou entre em contato!', await attach.getQR(flow.agendaConfirm2));
					await context.setState({ dialog: 'broadcast' });
				}
				break;
			case 'agendaMessage':
				// here we need to check if there's any entry in notificacao_agenda that matches the ccs
				await context.setState({ notification_agenda: await db.getAgendaNotificationFromID(context.state.broadcastAgenda.id) });
				if (!context.state.notification_agenda) { // error
					await context.setState({ dialog: '', notification_agenda: '', broadcastAgenda: '', broadcastNumber: '', CCSBroadcast: '' }); // eslint-disable-line object-curly-newline
					await context.sendText('Ocorreu um erro ao pesquisar agendas! Tente novamente ou entre em contato!', await attach.getQR(flow.agendaConfirm2));
				} else if (context.state.notification_agenda.length === 0) { // no user will be notified if there's zero notification_agenda
					await context.setState({ dialog: '', notification_agenda: '', broadcastAgenda: '', broadcastNumber: '', CCSBroadcast: '' }); // eslint-disable-line object-curly-newline
					await context.sendText('Não encontrei nenhuma notificação para essa agenda! Isso quer dizer que desde que a reunião foi '
              + 'marcada ninguém pesquisou por ela. Que pena!', await attach.getQR(flow.agendaConfirm2));
				} else if (context.state.notification_agenda.length === 1) {
					await context.sendText(`Tudo bem! Escreva sua mensagem abaixo, ela será enviada apenas para ${context.state.notification_agenda.length} usuário. `
              + 'Antes de envia-la, iremos mostrar como ela ficou e confirmar seu envio.', await attach.getQR(flow.agendaConfirm2));
				} else {
					await context.sendText(`Tudo bem! Escreva sua mensagem abaixo, ela será enviada para ${context.state.notification_agenda.length} usuários. `
              + 'Antes de envia-la, iremos mostrar como ficou a mensagem e confirmar seu envio.', await attach.getQR(flow.agendaConfirm2));
				}
				break;
			case 'agendaConfirmText':
				await context.sendText('Sua mensagem aparecerá assim:');
				await context.sendText(context.state.broadcastText);
				await context.sendText('Podemos envia-la?', await attach.getQR(flow.agendaConfirmText));
				break;
			case 'broadcast':
				await context.sendText('Ok! Aqui você poderá enviar uma mensagem para todos os usuários que se vincularam a um conselho.'
            + '\nDigite apenas o número (id) do conselho desejado, entre 1001 e 1110. Por exemplo: O CCS Casimiro de Abreu é o 1031 e o CCS AISP 27 é o 1011.', await attach.getQR(flow.warnCalendar));
				break;
			case 'writeMessage':
				await context.sendText(`Tudo bem! Escreva sua mensagem abaixo, ela será enviada para todos os usuários que visualizaram o CCS ${context.state.broadcastNumber}.`);
				break;
			case 'broadcastSent': {
				await context.sendText('OK, estamos enviando...');
				let result;
				if (context.state.cameFromBroadcast === true) {
					result = await sendAdminBroadcast(context.state.broadcastText, `ccs${context.state.broadcastNumber}`);
				} else {
					result = await sendAdminBroadcast(context.state.broadcastText, `agenda${context.state.notification_agenda[0].agendas_id}`);
				}
				if (result.broadcast_id) {
					await context.sendText(`Enviamos o broadcast ${result.broadcast_id} com sucesso.`, await attach.getQR(flow.broadcastSent));
				} else {
					await context.sendText(`Ocorreu um erro na hora de enviar! Avise nossos desenvolvedores => ${result.message}`, await attach.getQR(flow.broadcastSent));
				}
				await context.setState({ dialog: '', notification_agenda: '', broadcastAgenda: '', broadcastNumber: '', CCSBroadcast: '', cameFromBroadcast: '' }); // eslint-disable-line object-curly-newline
				break;
			}
			case 'metrics':
				await context.sendText(
					'Insira o id do broadcast que você deseja. Exemplo: 332286104187677. Esse id é dado depois que você envia um broadcast. '
            + '(Se for um broadcast que você acabou de enviar recomendamos esperar alguns minutos para ter o resultado correto). ',
					await attach.getQR(flow.metrics),
				);
				break;
				// Notifications flow ---------------------------------------------------------------------------
			case 'disableNotifications':
				if (await help.dissociateLabelsFromUser(context.session.user.id)) { // remove every label from user
					await help.addUserToBlackList(context.session.user.id); // add user to the 'blacklist'
					await context.sendText('Você quem manda. Não estarei mais te enviando nenhuma notificação. Se quiser voltar a receber nossas novidades, '
				+ 'clique na opção "Ativar Notificações" no menu abaixo. ⬇️', await attach.getQR(flow.notificationDisable));
					await events.addCustomAction(context.session.user.id, 'Usuario desliga notificacoes');
				}
				break;
			case 'enableNotifications':
				if (await help.removeUserFromBlackList(context.session.user.id)) { // remove blacklist label from user
					await context.sendText('Legal! Estarei te interando das novidades! Se quiser parar de receber nossas novidades, '
					+ 'clique na opção "Desativar Notificações" no menu abaixo. ⬇️', await attach.getQR(flow.notificationDisable));
					await events.addCustomAction(context.session.user.id, 'Usuario liga notificacoes');
				}
				break;
			} // dialog switch
		} catch (error) {
			// await Sentry.captureException(error);
			const date = new Date();
			console.log(`Parece que aconteceu um erro as ${date.toLocaleTimeString('pt-BR')} de ${date.getDate()}/${date.getMonth() + 1} =>`);
			console.log(error);
			await context.sendText('Ops. Tive um erro interno. Tente novamente.', await attach.getQR(flow.error));

			await Sentry.configureScope(async (scope) => {
				scope.setUser({ username: context.session.user.first_name });
				scope.setExtra('state', context.state);
				throw error;
			});
		}

		// });
	} // echo delivery
};

