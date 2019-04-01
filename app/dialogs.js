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

module.exports.sendGreetings = sendGreetings;
module.exports.sendCouncilMenu = sendCouncilMenu;
module.exports.wannaKnowMembers = wannaKnowMembers;
