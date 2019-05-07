const googleMapsClient = require('@google/maps').createClient({
	key: process.env.GOOGLE_MAPS_API_KEY,
	Promise,
});

const flow = require('./flow');
const attach = require('./attach');
const db = require('./DB_helper');
const metric = require('./DB_metrics');
const events = require('./events');
const help = require('./helpers');
const geoHelp = require('./geo_aux');
const appcivicoApi = require('./chatbot_api');


async function sendCouncilMenu(context) {
	await context.setState({ mapsResults: '', dialog: 'councilMenu' });
	await context.typingOn();
	if (!context.state.CCS) { // Quer saber sobre o Conselho mais próximo de você?
		await context.sendText(flow.whichCCS.thirdMessage, await attach.getQR(flow.whichCCS));
	} else { // "Escolha uma das opções"
		await context.sendText(
			flow.councilMenu.firstMessage,
			{ quick_replies: await help.checkMenu(context.state.CCS.id, [flow.calendarOpt, flow.subjectsOpt, flow.resultsOpt, flow.joinOpt], db) },
		);
		await metric.userAddOrUpdate(context);
	}
	await context.typingOff();
	await events.addCustomAction(context.session.user.id, 'Usuario no Menu do Conselho');
}

module.exports.sendCouncilMenu = sendCouncilMenu;

module.exports.sendGreetings = async (context) => {
	await context.typingOn();
	await context.sendImage(flow.greetings.greetImage);
	await context.sendText(flow.greetings.welcome);
	await context.sendText(flow.greetings.firstMessage, await attach.getQR(flow.greetings));
	await context.typingOff();
	await metric.userAddOrUpdate(context);
};

module.exports.wannaKnowMembers = async (context) => {
	await context.typingOn();
	await context.setState({ diretoria: await db.getDiretoria(context.state.CCS.id) }); // all the members of the the diretoria
	await context.setState({ diretoriaAtual: [] }); // stored active members on present date
	await context.state.diretoria.forEach((element) => { // check which members of the diretoria aren't active today
		if (Date.parse(element.fim_gestao) > new Date()) { context.state.diretoriaAtual.push(element); }
	});

	if (Object.keys(context.state.diretoriaAtual).length > 0) { // if there's at least one active member today we show the members(s)
		await context.sendText(`${flow.wannaKnowMembers.firstMessage} ${context.state.CCS.ccs} atualmente.`);
		await attach.sendCarouselDiretoria(context, context.state.diretoriaAtual);
	} else { // if there's no active members we show the last 10 that became members (obs: 10 is the limit for elements in carousel)
		await context.sendText(flow.wannaKnowMembers.notActive.replace('<ccs>', context.state.CCS.ccs));
		await attach.sendCarouselDiretoria(context, context.state.diretoria);
	}
	await context.setState({ diretoria: '', diretoriaAtual: '', mapsResults: '' }); // cleaning up
	await events.addCustomAction(context.session.user.id, 'Usuario ve Diretoria');

	// checking if user has either searchedBairro or searcherCity to find the membros_natos
	if ((context.state.CCS.bairro && context.state.CCS.bairro.length > 0) || (context.state.CCS.municipio && context.state.CCS.municipio.length > 0)) {
		if (context.state.CCS.bairro && context.state.CCS.bairro.length > 0) {
			await context.setState({ membrosNatos: await db.getMembrosNatosBairro(context.state.CCS.bairro, context.state.CCS.id) });
		} else if ((context.state.CCS.municipio && context.state.CCS.municipio.length > 0) && (!context.state.membrosNatos || context.state.membrosNatos.length === 0)) {
			await context.setState({ membrosNatos: await db.getMembrosNatosMunicipio(context.state.CCS.municipio, context.state.CCS.id) });
		}

		if (context.state.membrosNatos && context.state.membrosNatos.length !== 0) { // check if there was any results
			await setTimeout(async (membrosNatos) => {
				await context.sendText(flow.wannaKnowMembers.secondMessage);
				await attach.sendCarouselMembrosNatos(context, membrosNatos);
				await context.sendText(flow.wannaKnowMembers.thirdMessage);
				await sendCouncilMenu(context);
			}, 5000, context.state.membrosNatos);
			await context.setState({ membrosNatos: '' }); // cleaning up
		} else { // no membrosNatos
			await sendCouncilMenu(context);
		}
	} else { // no searchedBairro or searchedCity
		await sendCouncilMenu(context);
	}
};

module.exports.wantToTypeCidade = async (context) => {
	await context.setState({ cameFromGeo: false });
	await context.setState({ userInput: await help.formatString(context.event.message.text) }); // format user input
	if (context.state.userInput.length < 3) { // input limit (3 because we can leave 'rio' as an option)
		await context.sendText(flow.wantToType.tooShort);
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
			await context.setState({ dialog: 'nearestCouncil' }); // asked: false
		} else { // more than one municipio was found
			await context.sendText(`Hmm, encontrei ${context.state.municipiosFound.length} municípios na minha pesquisa. 🤔 `
				+ 'Me ajude a confirmar qual municípios você quer escolhendo uma das opções abaixo. ');
			await attach.sendMunicipioConfirmation(context, context.state.municipiosFound);
			await context.setState({ dialog: 'confirmMunicipio' });
		}
	} // else text length
};

module.exports.wantToTypeBairro = async (context) => {
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
	} else if ('paqueta'.includes(context.state.userInput)) { // paqueta case
		await context.setState({ CCS: await db.getCCSsFromID(1043) });
		await context.setState({ dialog: 'nearestCouncil' }); // asked: false
	} else { // regular case
		await context.setState({ bairro: await help.findCCSBairro(context.state.municipiosFound, context.state.userInput) });
		if (!context.state.bairro || context.state.bairro === null || context.state.bairro.length === 0) {
			await context.setState({ dialog: 'bairroNotFound' });
		} else if (context.state.bairro.length === 1) { // we found exactly one bairro with what was typed by the user
			await context.setState({ CCS: context.state.bairro[0] });
			await context.setState({ dialog: 'nearestCouncil' }); // asked: false
		} else { // more than one bairro was found
			await context.sendText(`Hmm, encontrei ${context.state.bairro.length} bairros na minha pesquisa. 🤔 `
				+ 'Me ajude a confirmar qual bairro você quer escolhendo uma das opções abaixo. ');
			await attach.sendConselhoConfirmation(context, context.state.bairro);
			await context.setState({ dialog: 'confirmBairro' });
		}
	}
};

module.exports.sequence = async (context) => {
	await help.buildSeqAnswers(context);
	if (context.state.questionNumber === '3' || context.state.questionNumber === '6') { // save answer and finish quiz, without the followUp message
		await db.saveSeqAnswer(context.session.user.id, context.state.agendaId, context.state.seqAnswers, context.state.seqInput);
		await context.sendText(flow.sequencia[context.state.questionNumber].question.replace('<nome>', context.session.user.first_name));
		await sendCouncilMenu(context);
	} else {
		await context.sendText(flow.sequencia[context.state.questionNumber].question.replace('<nome>', context.session.user.first_name), await attach.getQR(flow.sequencia[context.state.questionNumber]));
	}
};

module.exports.denunciaStart = async (context) => { // denunciaMenu
	await context.sendText(flow.denunciaStart.txt1.replace('<nome>', context.session.user.first_name));
	await context.sendText(flow.denunciaStart.txt2);
	if (context.state.CCS && context.state.CCS.bairro) { // if user has ccs and bairro show "confirmar" option
		await context.sendText(flow.denunciaHasBairro.txt1.replace('<bairro>', context.state.CCS.bairro), await attach.getQR(flow.denunciaHasBairro));
	} else {
		await context.sendText(flow.denunciaNoBairro.txt1, await attach.getQR(flow.denunciaNoBairro));
	}
};

module.exports.denunciaMenu = async (context) => { // denunciaMenu
	await context.setState({ denunciaCCS: context.state.CCS, onDenuncia: false }); // denunciaCCS is only used in the context of denuncia
	await context.setState({ CCS: context.state.oldCCS }); // if user had a CCS before he's not gonna lose it
	await context.sendText(flow.denunciaMenu.txt1, await attach.getQR(flow.denunciaMenu));
};

module.exports.optDenun = async (context) => {
	if (context.state.optDenunNumber === '4') {
		await context.sendText(flow.optDenun[context.state.optDenunNumber].txt1);
		await context.sendText(`<Um endereço relativo ao CCS do bairro ${context.state.denunciaCCS.bairro}>`);
		await context.sendText(flow.optDenun[context.state.optDenunNumber].txt2);
		await context.sendText(`<Outro endereço relativo ao CCS do bairro ${context.state.denunciaCCS.bairro}>`, { quick_replies: flow.goBackMenu });
	} else {
		await context.sendText(flow.optDenun[context.state.optDenunNumber]);
		await context.sendText(`<Um endereço relativo ao CCS do bairro ${context.state.denunciaCCS.bairro}>`, { quick_replies: flow.goBackMenu });
	}
	await appcivicoApi.postRecipientLabel(context.state.politicianData.user_id, context.session.user.id, 'denunciam');
	await db.saveDenuncia(context.session.user.id, context.state.denunciaCCS.id, context.state.optDenunNumber, context.state.denunciaText);
};

module.exports.loadintentQR = async (context) => {
	let result = '';
	switch (context.state.intentName.toLowerCase()) {
	case 'participar grupo':
	case 'serviços':
	case 'presente':
	case 'segurança':
	case 'reunião do conselho':
		result = await attach.getCouncilMenuQR(context.state.CCS, flow);
		break;
	case 'local errado':
		result = await attach.getQR(flow.whichCCS);
		result = result.quick_replies;
		break;
	case 'sim/não':
		result = [await attach.getVoltarQR(context.state.lastDialog)];
		break;
	case 'denuncia':
		await context.setState({ denunciaText: context.state.whatWasTyped });
		result = await attach.getQR(flow.denunciaStart);
		result = result.quick_replies;
		break;
	case 'agradecimento':
	case 'despedida':
	case 'ok':
	case 'parabéns':
	case 'xingamentos':
	default:
		result = flow.goBackMenu;
		break;
	}

	// if (result && result.length > 0) {
	// 	await context.setState({ dialog: '' });
	// }
	return { quick_replies: result };
};

module.exports.checkEmailInput = async (context) => {
	const mailRegex = new RegExp(/\S+@\S+/);
	await context.setState({ eMail: context.event.message.text.toLowerCase() });
	if (mailRegex.test(context.state.eMail)) { // valid mail
		await context.sendText(flow.userData.sucess);
		await context.setState({ dialog: 'userData' });
		await events.addCustomAction(context.session.user.id, 'Usuario deixou e-mail com sucesso');
		await metric.updateMailChatbotUserNoCCS(context.session.user.id, context.state.eMail);
		await appcivicoApi.postRecipient(context.state.politicianData.user_id, {
			fb_id: context.session.user.id,
			name: `${context.session.user.first_name} ${context.session.user.last_name}`,
			email: context.state.eMail,
		});
	} else { // invalid email
		await context.setState({ eMail: '', dialog: 'reAskMail' });
		await events.addCustomAction(context.session.user.id, 'Usuario nao conseguiu deixar e-mail');
	}
};

module.exports.checkPhoneInput = async (context) => {
	const phoneRegex = new RegExp(/^\+55\d{2}(\d{1})?\d{8}$/);
	await context.setState({ phone: `+55${context.event.message.text.replace(/[- .)(]/g, '')}` });
	if (phoneRegex.test(context.state.phone)) { // valid phone
		await context.setState({ dialog: 'gotPhone' });
		await events.addCustomAction(context.session.user.id, 'Usuario deixou fone com sucesso');
		await metric.updatePhoneChatbotUserNoCCS(context.session.user.id, context.state.phone);
		await appcivicoApi.postRecipient(context.state.politicianData.user_id, {
			fb_id: context.session.user.id,
			name: `${context.session.user.first_name} ${context.session.user.last_name}`,
			cellphone: context.state.phone,
		});
	} else { // invalid phone
		await context.setState({ phone: '', dialog: 'reAskPhone' });
		await events.addCustomAction(context.session.user.id, 'Usuario nao conseguiu deixar fone');
	}
};

module.exports.sendCalendario = async (context) => {
	await context.setState({ agenda: await db.getAgenda(context.state.CCS.id) });

	if (context.state.agenda) { // check if we have an agenda to show
		if (help.dateComparison(context.state.agenda.data) >= help.dateComparison(new Date())) { // check if next reunion is going to happen today or after today
			await context.sendText(`Veja o que encontrei sobre a próxima reunião do ${context.state.CCS.ccs}:`);
			await context.setState({ ageMsg: await help.getAgendaMessage(context.state.agenda) });
			await context.sendText(context.state.ageMsg);
			await context.setState({ ageMsg: '' });
			// sending menu options
			await context.setState({ QROptions: await help.checkMenu(context.state.CCS.id, help.calendarQROpt, db) });
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
				await help.linkUserToCustomLabel(context.session.user.id, `agenda${context.state.agenda.id}`); // create an agendaLabel using agenda_id
				await appcivicoApi.postRecipientLabel(context.state.politicianData.user_id, context.session.user.id, `agenda${context.state.agenda.id}`);
			}
		} else { // last reunion already happened
			await context.sendText(`Ainda não tem uma reunião agendada para o seu CCS. A última que aconteceu foi no dia ${help.formatDateDay(context.state.agenda.data)}.`);
			if (await help.checkUserOnLabel(context.session.user.id, process.env.LABEL_BLACKLIST) !== true) { // check if user is not on the blacklist !==
				await context.sendText('Assim que aparecer uma nova data aqui para mim, eu te aviso! 😉', { quick_replies: await help.checkMenu(context.state.CCS.id, help.calendarQROpt, db) });
				// before adding the user+ccs on the table we check if it's already there
				if (await db.checkNovaAgenda(context.session.user.id, context.state.agenda.id) !== true) { // !== true
					await db.addNovaAgenda(context.session.user.id, context.state.agenda.id); // if it's not we add it
				}
				await help.linkUserToCustomLabel(context.session.user.id, `agenda${context.state.agenda.id}`); // create an agendaLabel using agenda_id
				await appcivicoApi.postRecipientLabel(context.state.politicianData.user_id, context.session.user.id, `agenda${context.state.agenda.id}`);
			} else { // User is on the blacklist
				await context.setState({ QROptions: await help.checkMenu(context.state.CCS.id, help.calendarQROpt, db) });
				if (context.state.QROptions.find(obj => obj.payload === 'results')) { // check if we can send results (this whole part is necessary because the text changes)
					await context.sendText('Você pode ver os nossos últimos resultados clicando abaixo! 😊', { quick_replies: await help.checkMenu(context.state.CCS.id, help.calendarQROpt, db) });
				} else { // send text for no results
					await context.sendText(flow.calendar.preMenuMsgExtra, { quick_replies: context.state.QROptions });
				}
			}
		}
	} else { // no agenda at all, probably an error
		await context.sendText(`Não encontrei nenhuma reunião marcada para o ${context.state.CCS.ccs}.`);
		await context.sendText(flow.subjects.novidades, { quick_replies: await help.checkMenu(context.state.CCS.id, help.calendarQROpt, db) });
	}

	await events.addCustomAction(context.session.user.id, 'Usuario ve Agenda');
};

module.exports.sendSubjects = async (context) => {
	await context.setState({ assuntos: await db.getAssuntos(context.state.CCS.id) });
	if (!context.state.assuntos || context.state.assuntos.length === 0) { // no subjects so we show the standard ones
		// checking if there is an agenda for this ccs so we can show the standard subjects every reunion tends to have
		await context.setState({ agenda: await db.getAgenda(context.state.CCS.id) });
		// check if we have an agenda to show and if next reunion is going to happen today or after today
		if (context.state.agenda && await help.dateComparison(context.state.agenda.data) >= await help.dateComparison(new Date())) {
			await context.sendText(`${flow.subjects.firstMessage} \n- ${['Leitura e Aprovação da ATA anterior',
				'Comunicações Diversas', 'Assuntos Administrativos'].join('\n- ').replace(/,(?=[^,]*$)/, ' e')}.`);
		} else { // no agenda today or after so NO subjects at all
			await context.sendText(flow.subjects.noReunion);
			await context.sendText(flow.subjects.novidades, await attach.getQR(flow.subjects));
		}
	} else { // sending the bullet point list with the subjects
		await context.sendText(`${flow.subjects.firstMessage} \n- ${context.state.assuntos.join('\n- ').replace(/,(?=[^,]*$)/, ' e')}.`);
	}

	await context.sendText(flow.pautas.txt1, await attach.getQR(flow.pautas));
	await events.addCustomAction(context.session.user.id, 'Usuario ve Assuntos');
};

module.exports.sendResults = async (context) => {
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
	if (context.state.results && context.state.results.link_download && await help.urlExists(context.state.results.link_download) === true) { // check if link exists and is valid
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
	await context.setState({ QROptions: await help.checkMenu(context.state.CCS.id, [flow.calendarOpt, flow.subjectsOpt, flow.joinOpt], db) });
	if (context.state.QROptions.find(obj => obj.payload === 'subjects')) { // check if we can send subjects (this whole part is necessary because the text changes)
		await context.sendText(flow.results.preMenuMsg, { quick_replies: context.state.QROptions });
	} else { // send text for no subjects
		await context.sendText(flow.results.preMenuMsgExtra, { quick_replies: context.state.QROptions });
	}

	await events.addCustomAction(context.session.user.id, 'Usuario ve Resultados');
};

module.exports.findGeoLocation = async (context) => {
	await context.setState({ municipiosFound: '', bairro: '' });
	try {
		await context.setState({
			mapsResultsFull: await googleMapsClient.reverseGeocode({
				latlng: [context.state.geoLocation.lat, context.state.geoLocation.long],
				language: 'pt-BR',
			}).asPromise(),
		});
		if (context.state.mapsResultsFull.status === 200) {
			await context.setState({ mapsResults: context.state.mapsResultsFull.json.results });
			await context.setState({ mapsResultsFull: '' });

			if (await geoHelp.checkIfInRio(context.state.mapsResults) === true) { // we are in rio
				await context.setState({ mapsCity: await geoHelp.getCityFromGeo(context.state.mapsResults) });
				if (!context.state.mapsCity) {
					await context.sendText(flow.foundLocation.noFindGeo); // Desculpe, não consegui encontrar nenhum endereço. Parece que um erro aconteceu
					await context.sendText(flow.foundLocation.noSecond, await attach.getQR(flow.notFound));
				} else if (context.state.mapsCity.toLowerCase() === 'rio de janeiro') {
					await context.setState({ mapsBairro: await geoHelp.getNeighborhood(context.state.mapsResults[0].address_components) });
					await context.setState({ mapsResults: '' });
					if (context.state.mapsBairro) {
						if (context.state.mapsBairro === 'Paquetá') {
							await context.sendText(flow.sendLocation.inPaqueta, await attach.getQR(flow.checkPaqueta));
						} else if (context.state.mapsBairro.toLowerCase() === 'centro' || context.state.mapsBairro.toLowerCase() === 'colégio') {
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
					await context.setState({ CCSGeo: await db.getCCSsFromMunicipio(await help.formatString(context.state.mapsCity)) });
					await context.sendText(`${flow.foundLocation.firstMessage} ${context.state.mapsCity}`);
					await context.sendText(flow.foundLocation.secondMessage, await attach.getQRLocation2(flow.foundLocation));
				}
			} else { // not in rio
				await context.sendText(flow.sendLocation.notInRioState, await attach.getQRLocation(flow.geoMenu));
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
};
