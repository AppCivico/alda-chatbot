require('dotenv').config();

const cont = require('./context');
const flow = require('../app/flow');
const attach = require('../app/attach');
const events = require('../app/events');
const { checkMenu } = require('../app/helpers');
const metric = require('../app/DB_metrics');
const db = require('../app/DB_helper');
const dialogs = require('../app/dialogs');

jest.mock('../app/attach');
jest.mock('../app/DB_helper');
jest.mock('../app/DB_metrics');
jest.mock('../app/helpers');
jest.mock('../app/broadcast');
jest.mock('../app/events');
jest.mock('../app/send_issue');
jest.mock('../app/dialogFlow');

const templateCCS = {
	ccs: 'CCS LOT 49',
	id: 1049,
	status: 'Ativo',
	regiao: 'Capital',
	municipio: 'Rio de Janeiro',
	bairro: 'Barra da Tijuca',
	regiao_novo: null,
	meta_regiao: null,
	abrangencia_id: 49,
};


it('sendGreetings', async () => {
	const context = cont.quickReplyContext();
	await dialogs.sendGreetings(context, metric);

	await expect(context.typingOn).toBeCalled();
	await expect(context.sendImage).toBeCalledWith(flow.greetings.greetImage);
	await expect(context.sendText).toBeCalledWith(flow.greetings.welcome);
	await expect(context.sendText).toBeCalledWith(flow.greetings.firstMessage, await attach.getQR(flow.greetings));
	await expect(context.typingOff).toBeCalled();
	await expect(metric.userAddOrUpdate).toBeCalledWith(context);
});

it('sendCouncilMenu - no CCS', async () => {
	const context = cont.quickReplyContext();
	await dialogs.sendCouncilMenu(context, metric, events, db);

	await expect(context.setState).toBeCalledWith({ mapsResults: '' });
	await expect(context.typingOn).toBeCalled();
	await expect(!context.state.CCS).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.thirdMessage, await attach.getQR(flow.whichCCS));
	await expect(context.typingOff).toBeCalled();
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario no Menu do Conselho');
});

it('sendCouncilMenu - with CCS', async () => {
	const context = cont.quickReplyContext();
	context.state.CCS = {};
	await dialogs.sendCouncilMenu(context, metric, events, db);

	await expect(context.setState).toBeCalledWith({ mapsResults: '' });
	await expect(context.typingOn).toBeCalled();
	await expect(!context.state.CCS).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.councilMenu.firstMessage,
		{ quick_replies: await checkMenu(context.state.CCS.id, [flow.calendarOpt, flow.subjectsOpt, flow.resultsOpt, flow.joinOpt], db) });
	await expect(metric.userAddOrUpdate).toBeCalledWith(context);
	await expect(context.typingOff).toBeCalled();
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario no Menu do Conselho');
});

it('wannaKnowMembers - no active members', async () => {
	const context = cont.quickReplyContext();
	context.state.CCS = {}; context.state.diretoriaAtual = []; context.state.diretoria = [
		{ nome: 'Benny Profane', cargo: 'Presidente (a)', fim_gestao: '2018-11-01' },
	];
	await dialogs.wannaKnowMembers(context, db, metric, events);

	await expect(context.typingOn).toBeCalled();
	await expect(context.setState).toBeCalledWith({ diretoria: await db.getDiretoria(context.state.CCS.id) });
	await expect(context.setState).toBeCalledWith({ diretoriaAtual: [] });

	await expect(Object.keys(context.state.diretoriaAtual).length > 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.wannaKnowMembers.notActive.replace('<ccs>', context.state.CCS.ccs));
	await expect(attach.sendCarouselDiretoria).toBeCalledWith(context, context.state.diretoria);

	await expect(context.setState).toBeCalledWith({ diretoria: '', diretoriaAtual: '', mapsResults: '' });
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario ve Diretoria');

	await expect((context.state.CCS.bairro && context.state.CCS.bairro.length > 0) || (context.state.CCS.municipio && context.state.CCS.municipio.length > 0)).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ mapsResults: '' }); // sendCouncilMenu
});

it('wannaKnowMembers - active members', async () => {
	const context = cont.quickReplyContext();
	context.state.CCS = {}; context.state.diretoriaAtual = []; context.state.diretoria = [
		{ nome: 'Benny Profane', cargo: 'Presidente (a)', fim_gestao: '2000-01-01' },
		{ nome: 'Herbert Stencil', cargo: 'Vice-Presidente (a)', fim_gestao: '2049-01-01' },
	];
	await dialogs.wannaKnowMembers(context, db, metric, events);

	await expect(context.typingOn).toBeCalled();
	await expect(context.setState).toBeCalledWith({ diretoria: await db.getDiretoria(context.state.CCS.id) });
	await expect(context.setState).toBeCalledWith({ diretoriaAtual: [] });
	// forEach and push
	await expect(context.state.diretoriaAtual.length === 1).toBeTruthy(); // only one atual (Herbert)
	await expect(context.sendText).toBeCalledWith(`${flow.wannaKnowMembers.firstMessage} ${context.state.CCS.ccs} atualmente.`);
	await expect(attach.sendCarouselDiretoria).toBeCalledWith(context, context.state.diretoriaAtual);

	await expect(context.setState).toBeCalledWith({ diretoria: '', diretoriaAtual: '', mapsResults: '' });
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario ve Diretoria');

	await expect((context.state.CCS.bairro && context.state.CCS.bairro.length > 0) || (context.state.CCS.municipio && context.state.CCS.municipio.length > 0)).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ mapsResults: '' }); // sendCouncilMenu
});

it('wannaKnowMembers - no membrosNatos', async () => {
	const context = cont.quickReplyContext();
	context.state.CCS = templateCCS; context.state.diretoriaAtual = []; context.state.diretoria = [];
	await dialogs.wannaKnowMembers(context, db, metric, events);
	// skip diretoria
	await expect((context.state.CCS.bairro && context.state.CCS.bairro.length > 0) || (context.state.CCS.municipio && context.state.CCS.municipio.length > 0)).toBeTruthy();
	await expect((context.state.CCS.bairro && context.state.CCS.bairro.length > 0)).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ membrosNatos: await db.getMembrosNatosBairro(context.state.CCS.bairro, context.state.CCS.id) });
	// await expect(context.setState).toBeCalledWith({ membrosNatos: await db.getMembrosNatosMunicipio(context.state.CCS.municipio, context.state.CCS.id) });

	await expect(context.state.membrosNatos && context.state.membrosNatos.length !== 0).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ mapsResults: '' }); // sendCouncilMenu
});

it('wannaKnowMembers - membrosNatos', async () => {
	jest.useFakeTimers();
	const context = cont.quickReplyContext();
	context.state.CCS = templateCCS; context.state.diretoriaAtual = []; context.state.diretoria = [];
	context.state.membrosNatos = [
		{ nome: 'Rachel Owlglass', cargo: 'Delegado (a)' },
	];
	await dialogs.wannaKnowMembers(context, db, metric, events);
	// skip diretoria
	await expect((context.state.CCS.bairro && context.state.CCS.bairro.length > 0) || (context.state.CCS.municipio && context.state.CCS.municipio.length > 0)).toBeTruthy();
	await expect((context.state.CCS.bairro && context.state.CCS.bairro.length > 0)).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ membrosNatos: await db.getMembrosNatosBairro(context.state.CCS.bairro, context.state.CCS.id) });
	await expect((context.state.CCS.municipio && context.state.CCS.municipio.length > 0) && (!context.state.membrosNatos || context.state.membrosNatos.length === 0)).toBeFalsy();

	await expect(context.state.membrosNatos && context.state.membrosNatos.length !== 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ membrosNatos: '' }); // before the timer
	jest.runAllTimers();
	await expect(context.sendText).toBeCalledWith(flow.wannaKnowMembers.secondMessage);
	await expect(attach.sendCarouselMembrosNatos).toBeCalledWith(context, context.state.membrosNatos);
	await expect(context.sendText).toBeCalledWith(flow.wannaKnowMembers.thirdMessage);
	await expect(context.setState).toBeCalledWith({ mapsResults: '' }); // sendCouncilMenu
});
