const flow = require('./flow');
const attach = require('./attach');
const db = require('./DB_helper');
const metric = require('./DB_metrics');
const events = require('./events');
const help = require('./helpers');
const { postRecipient } = require('./chatbot_api');

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

module.exports.optDenun = async (context, postRecipientLabel) => {
	if (context.state.optDenunNumber === '4') {
		await context.sendText(flow.optDenun[context.state.optDenunNumber].txt1);
		await context.sendText(`<Um endereço relativo ao CCS do bairro ${context.state.denunciaCCS.bairro}>`);
		await context.sendText(flow.optDenun[context.state.optDenunNumber].txt2);
		await context.sendText(`<Outro endereço relativo ao CCS do bairro ${context.state.denunciaCCS.bairro}>`, { quick_replies: flow.goBackMenu });
	} else {
		await context.sendText(flow.optDenun[context.state.optDenunNumber]);
		await context.sendText(`<Um endereço relativo ao CCS do bairro ${context.state.denunciaCCS.bairro}>`, { quick_replies: flow.goBackMenu });
	}
	await postRecipientLabel(context.state.politicianData.user_id, context.session.user.id, 'denunciam');
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
		await postRecipient(context.state.politicianData.user_id, {
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
		await postRecipient(context.state.politicianData.user_id, {
			fb_id: context.session.user.id,
			name: `${context.session.user.first_name} ${context.session.user.last_name}`,
			cellphone: context.state.phone,
		});
	} else { // invalid phone
		await context.setState({ phone: '', dialog: 'reAskPhone' });
		await events.addCustomAction(context.session.user.id, 'Usuario nao conseguiu deixar fone');
	}
};
