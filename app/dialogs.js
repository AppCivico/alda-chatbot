const flow = require('./flow');
const attach = require('./attach');
const { checkMenu } = require('./helpers');

async function sendGreetings(context, metric) {
	await context.typingOn();
	await context.sendImage(flow.greetings.greetImage);
	await context.sendText(flow.greetings.welcome);
	await context.sendText(flow.greetings.firstMessage, await attach.getQR(flow.greetings));
	await context.typingOff();
	await metric.userAddOrUpdate(context);
}

async function sendCouncilMenu(context, metric, events, db) {
	await context.setState({ mapsResults: '' });
	await context.typingOn();
	if (!context.state.CCS) { // Quer saber sobre o Conselho mais próximo de você?
		await context.sendText(flow.whichCCS.thirdMessage, await attach.getQR(flow.whichCCS));
	} else { // "Escolha uma das opções"
		await context.sendText(
			flow.councilMenu.firstMessage,
			{ quick_replies: await checkMenu(context.state.CCS.id, [flow.calendarOpt, flow.subjectsOpt, flow.resultsOpt, flow.joinOpt], db) },
		);
		await metric.userAddOrUpdate(context);
	}
	await context.typingOff();
	await events.addCustomAction(context.session.user.id, 'Usuario no Menu do Conselho');
}

async function wannaKnowMembers(context, db, metric, events) {
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
				await sendCouncilMenu(context, metric, events, db);
			}, 5000, context.state.membrosNatos);
			await context.setState({ membrosNatos: '' }); // cleaning up
		} else { // no membrosNatos
			await sendCouncilMenu(context, metric, events, db);
		}
	} else { // no searchedBairro or searchedCity
		await sendCouncilMenu(context, metric, events, db);
	}
}

async function wantToTypeCidade(context, help, db) {
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
			await context.setState({ dialog: 'nearestCouncil' }); // asked: false
		} else { // more than one municipio was found
			await context.sendText(`Hmm, encontrei ${context.state.municipiosFound.length} municípios na minha pesquisa. 🤔 `
				+ 'Me ajude a confirmar qual municípios você quer escolhendo uma das opções abaixo. ');
			await attach.sendMunicipioConfirmation(context, context.state.municipiosFound);
			await context.setState({ dialog: 'confirmMunicipio' });
		}
	} // else text length
}

async function wantToTypeBairro(context, help, db) {
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
}

module.exports.denunciaMenu = async (context) => { // denunciaMenu
	await context.setState({ denunciaCCS: context.state.CCS, onDenuncia: false }); // denunciaCCS is only used in the context of denuncia
	await context.setState({ CCS: context.state.oldCCS }); // if user had a CCS before he's not gonna lose it
	await context.sendText(flow.denunciaMenu.txt1, await attach.getQR(flow.denunciaMenu));
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

module.exports.optDenun = async (context) => {
	if (context.state.optDenunNumber === '4') {
		await context.sendText(flow.optDenun[context.state.optDenunNumber].txt1);
		await context.sendText('Um endereço');
		await context.sendText(flow.optDenun[context.state.optDenunNumber].txt2);
		await context.sendText('Outro endereço', { quick_replies: [flow.goBackMenu] });
	} else {
		await context.sendText(flow.optDenun[context.state.optDenunNumber]);
		await context.sendText('Um endereço', { quick_replies: [flow.goBackMenu] });
	}
};

module.exports.sendGreetings = sendGreetings;
module.exports.sendCouncilMenu = sendCouncilMenu;
module.exports.wannaKnowMembers = wannaKnowMembers;
module.exports.wantToTypeCidade = wantToTypeCidade;
module.exports.wantToTypeBairro = wantToTypeBairro;
