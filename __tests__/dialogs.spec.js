require('dotenv').config();

const cont = require('./context');
const flow = require('../app/flow');
const attach = require('../app/attach');
const events = require('../app/events');
const help = require('../app/helpers');
const metric = require('../app/DB_metrics');
const db = require('../app/DB_helper');
const dialogs = require('../app/dialogs');
const { postRecipient } = require('../app/chatbot_api');

jest.mock('../app/attach');
jest.mock('../app/chatbot_api');
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
	await dialogs.sendGreetings(context);

	await expect(context.typingOn).toBeCalled();
	await expect(context.sendImage).toBeCalledWith(flow.greetings.greetImage);
	await expect(context.sendText).toBeCalledWith(flow.greetings.welcome);
	await expect(context.sendText).toBeCalledWith(flow.greetings.firstMessage, await attach.getQR(flow.greetings));
	await expect(context.typingOff).toBeCalled();
	await expect(metric.userAddOrUpdate).toBeCalledWith(context);
});

it('sendCouncilMenu - no CCS', async () => {
	const context = cont.quickReplyContext();
	await dialogs.sendCouncilMenu(context);

	await expect(context.setState).toBeCalledWith({ mapsResults: '', dialog: 'councilMenu' });
	await expect(context.typingOn).toBeCalled();
	await expect(!context.state.CCS).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.thirdMessage, await attach.getQR(flow.whichCCS));
	await expect(context.typingOff).toBeCalled();
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario no Menu do Conselho');
});

it('sendCouncilMenu - with CCS', async () => {
	const context = cont.quickReplyContext();
	context.state.CCS = {};
	await dialogs.sendCouncilMenu(context);

	await expect(context.setState).toBeCalledWith({ mapsResults: '', dialog: 'councilMenu' });
	await expect(context.typingOn).toBeCalled();
	await expect(!context.state.CCS).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.councilMenu.firstMessage,
		{ quick_replies: await help.checkMenu(context.state.CCS.id, [flow.calendarOpt, flow.subjectsOpt, flow.resultsOpt, flow.joinOpt], db) });
	await expect(metric.userAddOrUpdate).toBeCalledWith(context);
	await expect(context.typingOff).toBeCalled();
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario no Menu do Conselho');
});

it('wannaKnowMembers - no active members', async () => {
	const context = cont.quickReplyContext();
	context.state.CCS = {}; context.state.diretoriaAtual = []; context.state.diretoria = [
		{ nome: 'Benny Profane', cargo: 'Presidente (a)', fim_gestao: '2018-11-01' },
	];
	await dialogs.wannaKnowMembers(context);

	await expect(context.typingOn).toBeCalled();
	await expect(context.setState).toBeCalledWith({ diretoria: await db.getDiretoria(context.state.CCS.id) });
	await expect(context.setState).toBeCalledWith({ diretoriaAtual: [] });

	await expect(Object.keys(context.state.diretoriaAtual).length > 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.wannaKnowMembers.notActive.replace('<ccs>', context.state.CCS.ccs));
	await expect(attach.sendCarouselDiretoria).toBeCalledWith(context, context.state.diretoria);

	await expect(context.setState).toBeCalledWith({ diretoria: '', diretoriaAtual: '', mapsResults: '' });
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario ve Diretoria');

	await expect((context.state.CCS.bairro && context.state.CCS.bairro.length > 0) || (context.state.CCS.municipio && context.state.CCS.municipio.length > 0)).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ mapsResults: '', dialog: 'councilMenu' }); // sendCouncilMenu
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
	await expect(context.setState).toBeCalledWith({ mapsResults: '', dialog: 'councilMenu' }); // sendCouncilMenu
});

it('wannaKnowMembers - membrosNatos and bairro', async () => {
	jest.useFakeTimers();
	const context = cont.quickReplyContext();
	context.state.CCS = templateCCS; context.state.diretoriaAtual = []; context.state.diretoria = [];
	context.state.membrosNatos = [{ nome: 'Rachel Owlglass', cargo: 'Delegado (a)' }];

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
	await expect(context.setState).toBeCalledWith({ mapsResults: '', dialog: 'councilMenu' }); // sendCouncilMenu
});

it('wannaKnowMembers - no membrosNatos and no bairro', async () => {
	const context = cont.quickReplyContext();
	context.state.CCS = templateCCS; context.state.diretoriaAtual = []; context.state.diretoria = [];
	context.state.CCS.bairro = undefined;

	await dialogs.wannaKnowMembers(context, db, metric, events);
	// skip diretoria
	await expect((context.state.CCS.bairro && context.state.CCS.bairro.length > 0)).toBeFalsy();
	await expect((context.state.CCS.municipio && context.state.CCS.municipio.length > 0) && (!context.state.membrosNatos || context.state.membrosNatos.length === 0)).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ membrosNatos: await db.getMembrosNatosMunicipio(context.state.CCS.municipio, context.state.CCS.id) });

	await expect(context.state.membrosNatos && context.state.membrosNatos.length !== 0).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ mapsResults: '', dialog: 'councilMenu' }); // sendCouncilMenu
});

it('Enter invalid email', async () => {
	const context = cont.textContext('Não é válido!', 'eMail');
	context.state.eMail = 'Não é válido!';
	const mailRegex = new RegExp(/\S+@\S+/);

	await dialogs.checkEmailInput(context);
	await expect(context.setState).toBeCalledWith({ eMail: context.event.message.text.toLowerCase() });
	await expect(context.state.eMail).not.toMatch(mailRegex);
	await expect(context.setState).toBeCalledWith({ eMail: '', dialog: 'reAskMail' });
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario nao conseguiu deixar e-mail');
});

it('Enter valid email', async () => {
	const context = cont.textContext('qualquer@coisa.com', 'eMail');
	context.state.eMail = 'qualquer@coisa.com';
	const mailRegex = new RegExp(/\S+@\S+/);

	await dialogs.checkEmailInput(context);
	await expect(context.setState).toBeCalledWith({ eMail: context.event.message.text.toLowerCase() });
	await expect(mailRegex.test(context.state.eMail)).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.userData.sucess);
	await expect(context.setState).toBeCalledWith({ dialog: 'userData' });
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario deixou e-mail com sucesso');
	await expect(metric.updateMailChatbotUserNoCCS).toBeCalledWith(context.session.user.id, context.state.eMail);
	await expect(postRecipient).toBeCalled();
});

it('Enter invalid phone', async () => {
	const context = cont.textContext('119999aa-8888', 'whatsApp');
	context.state.phone = `+55${'119999aa-8888'.replace(/[- .)(]/g, '')}`;
	const phoneRegex = new RegExp(/^\+55\d{2}(\d{1})?\d{8}$/);
	await dialogs.checkPhoneInput(context);

	await expect(context.setState).toBeCalledWith({ phone: context.state.phone });
	await expect(context.state.phone).not.toMatch(phoneRegex);
	await expect(context.setState).toBeCalledWith({ phone: '', dialog: 'reAskPhone' });
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario nao conseguiu deixar fone');
});

it('Enter valid phone', async () => {
	const context = cont.textContext('11999998888', 'whatsApp');
	context.state.phone = `+55${'11999998888'.replace(/[- .)(]/g, '')}`;
	const phoneRegex = new RegExp(/^\+55\d{2}(\d{1})?\d{8}$/);

	await dialogs.checkPhoneInput(context);
	await expect(context.setState).toBeCalledWith({ phone: context.state.phone });
	await expect(phoneRegex.test(context.state.phone)).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'gotPhone' });
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario deixou fone com sucesso');
	await expect(metric.updatePhoneChatbotUserNoCCS).toBeCalledWith(context.session.user.id, context.state.phone);
	await expect(postRecipient).toBeCalled();
});

it('denunciaStart - no CCS', async () => {
	const context = cont.quickReplyContext();

	await dialogs.denunciaStart(context);
	await expect(context.sendText).toBeCalledWith(flow.denunciaStart.txt1.replace('<nome>', context.session.user.first_name));
	await expect(context.sendText).toBeCalledWith(flow.denunciaStart.txt2);
	await expect(context.state.CCS && context.state.CCS.bairro).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.denunciaNoBairro.txt1, await attach.getQR(flow.denunciaNoBairro));
});

it('denunciaStart - with CCS', async () => {
	const context = cont.quickReplyContext();
	context.state.CCS = { bairro: 'foobar' };

	await dialogs.denunciaStart(context);
	await expect(context.sendText).toBeCalledWith(flow.denunciaStart.txt1.replace('<nome>', context.session.user.first_name));
	await expect(context.sendText).toBeCalledWith(flow.denunciaStart.txt2);
	await expect(context.state.CCS && context.state.CCS.bairro).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.denunciaHasBairro.txt1.replace('<bairro>', context.state.CCS.bairro), await attach.getQR(flow.denunciaHasBairro));
});

it('denunciaMenu', async () => {
	const context = cont.quickReplyContext();

	await dialogs.denunciaMenu(context);
	await expect(context.setState).toBeCalledWith({ denunciaCCS: context.state.CCS, onDenuncia: false });
	await expect(context.setState).toBeCalledWith({ CCS: context.state.oldCCS });
	await expect(context.sendText).toBeCalledWith(flow.denunciaMenu.txt1, await attach.getQR(flow.denunciaMenu));
});

it('sequence - question 3', async () => {
	const context = cont.quickReplyContext();
	context.state.questionNumber = '3';
	await dialogs.sequence(context);
	await expect(help.buildSeqAnswers).toBeCalledWith(context);
	await expect(context.state.questionNumber === '3' || context.state.questionNumber === '6').toBeTruthy();
	await expect(db.saveSeqAnswer).toBeCalledWith(context.session.user.id, context.state.agendaId, context.state.seqAnswers, context.state.seqInput);
	await expect(context.sendText).toBeCalledWith(flow.sequencia[context.state.questionNumber].question.replace('<nome>', context.session.user.first_name));
	await expect(context.setState).toBeCalledWith({ mapsResults: '', dialog: 'councilMenu' }); // sendCouncilMenu
});

it('sequence - not question 3', async () => {
	const context = cont.quickReplyContext();
	context.state.questionNumber = '5';
	await dialogs.sequence(context);
	await expect(help.buildSeqAnswers).toBeCalledWith(context);
	await expect(context.state.questionNumber === '3' || context.state.questionNumber === '6').toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.sequencia[context.state.questionNumber].question.replace('<nome>', context.session.user.first_name), await attach.getQR(flow.sequencia[context.state.questionNumber]));
});

it('optDenun - option 4', async () => {
	const context = cont.quickReplyContext();
	context.state.optDenunNumber = '4'; context.state.denunciaCCS = { bairro: 'foobar' };
	const postRecipientLabel = jest.fn();

	await dialogs.optDenun(context, postRecipientLabel);
	await expect(context.state.optDenunNumber === '4').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.optDenun[context.state.optDenunNumber].txt1);
	await expect(context.sendText).toBeCalledWith(`<Um endereço relativo ao CCS do bairro ${context.state.denunciaCCS.bairro}>`);
	await expect(context.sendText).toBeCalledWith(flow.optDenun[context.state.optDenunNumber].txt2);
	await expect(context.sendText).toBeCalledWith(`<Outro endereço relativo ao CCS do bairro ${context.state.denunciaCCS.bairro}>`, { quick_replies: flow.goBackMenu });

	await expect(postRecipientLabel).toBeCalledWith(context.state.politicianData.user_id, context.session.user.id, 'denunciam');
	await expect(db.saveDenuncia).toBeCalledWith(context.session.user.id, context.state.denunciaCCS.id, context.state.optDenunNumber, context.state.denunciaText);
});

it('optDenun - not option 4', async () => {
	const context = cont.quickReplyContext();
	context.state.optDenunNumber = '3'; context.state.denunciaCCS = { bairro: 'foobar' };
	const postRecipientLabel = jest.fn();

	await dialogs.optDenun(context, postRecipientLabel);
	await expect(context.state.optDenunNumber === '4').toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.optDenun[context.state.optDenunNumber]);
	await expect(context.sendText).toBeCalledWith(`<Um endereço relativo ao CCS do bairro ${context.state.denunciaCCS.bairro}>`, { quick_replies: flow.goBackMenu });

	await expect(postRecipientLabel).toBeCalledWith(context.state.politicianData.user_id, context.session.user.id, 'denunciam');
	await expect(db.saveDenuncia).toBeCalledWith(context.session.user.id, context.state.denunciaCCS.id, context.state.optDenunNumber, context.state.denunciaText);
});

it('wantToTypeCidade - less than 3 chars less than 3 tries', async () => {
	const context = cont.textContext('ab', 'wantToType1');
	context.state.userInput = 'ab'; context.state.retryCount = 0;

	await dialogs.wantToTypeCidade(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 3).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.wantToType.tooShort);
	await expect(context.setState).toBeCalledWith({ dialog: 'wantToType1' });
});

it('wantToTypeCidade - searched rio de janeiro', async () => {
	const context = cont.textContext('rio de janeiro', 'retryType');
	context.state.userInput = 'rio de janeiro';

	await dialogs.wantToTypeCidade(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 3).toBeFalsy();
	await expect('rio de janeiro'.includes(context.state.userInput)).toBeTruthy();
	await context.setState({ municipiosFound: await db.getCCSsFromMunicipio('rio de janeiro') });
	await context.setState({ dialog: 'wantToType2' });
});

it('wantToTypeCidade - found zero municipio', async () => {
	const context = cont.textContext('são paulo', 'wantToChange');
	context.state.userInput = 'são paulo';

	await dialogs.wantToTypeCidade(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 3).toBeFalsy();
	await expect('rio de janeiro'.includes(context.state.userInput)).toBeFalsy();
	context.state.municipiosFound = [];
	await expect(context.setState).toBeCalledWith({ municipiosFound: await db.getCCSsFromMunicipio(context.state.userInput) });
	await expect(!context.state.municipiosFound || context.state.municipiosFound.length === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'municipioNotFound' });
});

it('wantToTypeCidade - found one municipio', async () => {
	const context = cont.textContext('baixada', 'retryType');
	context.state.userInput = 'baixada';
	context.state.municipiosFound = [{ foo: 'bar' }];

	await dialogs.wantToTypeCidade(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 3).toBeFalsy();
	await expect('rio de janeiro'.includes(context.state.userInput)).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ municipiosFound: await db.getCCSsFromMunicipio(context.state.userInput) });
	await expect(!context.state.municipiosFound || context.state.municipiosFound.length === 0).toBeFalsy();
	await expect(context.state.municipiosFound.length === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ CCS: context.state.municipiosFound[0] });
	await expect(context.setState).toBeCalledWith({ dialog: 'nearestCouncil' });
});

it('wantToTypeCidade - found many municipios', async () => {
	const context = cont.textContext('baixada', 'retryType');
	context.state.userInput = 'baixada';
	context.state.municipiosFound = [{ foo: 'bar' }, { bar: 'foo' }];

	await dialogs.wantToTypeCidade(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 3).toBeFalsy();
	await expect('rio de janeiro'.includes(context.state.userInput)).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ municipiosFound: await db.getCCSsFromMunicipio(context.state.userInput) });
	await expect(!context.state.municipiosFound || context.state.municipiosFound.length === 0).toBeFalsy();
	await expect(context.state.municipiosFound.length === 1).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(`Hmm, encontrei ${context.state.municipiosFound.length} municípios na minha pesquisa. 🤔 `
		+ 'Me ajude a confirmar qual municípios você quer escolhendo uma das opções abaixo. ');
	await expect(attach.sendMunicipioConfirmation).toBeCalledWith(context, context.state.municipiosFound);
	await expect(context.setState).toBeCalledWith({ dialog: 'confirmMunicipio' });
});

it('wantToTypeBairro - less than 4 chars', async () => {
	const context = cont.textContext('abc', 'wantToType2');
	context.state.userInput = 'abc';	context.state.municipiosFound = [{}]; 	context.state.unfilteredBairros = [];	context.state.sugestaoBairro = [{ foo: 'bar' }];

	await dialogs.wantToTypeBairro(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 4).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.wantToType2.tooShort);
	await expect(context.setState).toBeCalledWith({ dialog: 'wantToType2' });
});

it('wantToTypeBairro - centro special case', async () => {
	const context = cont.textContext('centro', 'wantToType2');
	context.state.userInput = 'centro'; context.state.bairro = [{ bairro: 'centro' }]; context.state.municipiosFound = [{ regiao: 'capital', municipio: 'Rio de Janeiro' }];
	context.state.unfilteredBairros = [];	context.state.sugestaoBairro = [{ foo: 'bar' }];

	await dialogs.wantToTypeBairro(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 4).toBeFalsy();
	await expect(context.state.municipiosFound[0].municipio.toLowerCase() === 'rio de janeiro' && 'centro'.includes(context.state.userInput)).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ bairro: await help.findBairroCCSID(context.state.municipiosFound, 'centro') });
	await expect(context.sendText).toBeCalledWith(`Encontrei ${context.state.bairro.length} conselhos no bairro ${context.state.bairro[0].bairro} na cidade `
			+ `${context.state.municipiosFound[0].municipio}. 📍 Escolha qual dos seguintes complementos melhor se encaixa na sua região:`);
	await expect(attach.sendCentroConfirmation).toBeCalledWith(context, context.state.bairro);
	await expect(context.setState).toBeCalledWith({ dialog: 'confirmBairro' });
});

it('wantToTypeBairro - colegio special case', async () => {
	const context = cont.textContext('colegio', 'wantToType2');
	context.state.userInput = 'colegio'; context.state.bairro = [{ bairro: 'colegio' }]; context.state.municipiosFound = [{ regiao: 'capital', municipio: 'Rio de Janeiro' }];
	context.state.unfilteredBairros = [];	context.state.sugestaoBairro = [{ foo: 'bar' }];

	await dialogs.wantToTypeBairro(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 4).toBeFalsy();
	await expect(context.state.municipiosFound[0].municipio.toLowerCase() === 'rio de janeiro' && 'colegio'.includes(context.state.userInput)).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ bairro: await help.findBairroCCSID(context.state.municipiosFound, 'colegio') });
	await expect(context.sendText).toBeCalledWith(`Encontrei ${context.state.bairro.length} conselhos no bairro ${context.state.bairro[0].bairro} na cidade `
		+ `${context.state.municipiosFound[0].municipio}. Para que eu encontre o conselho certo, escolha a delegacia de Polícia mais próxima a sua casa:`);
	await expect(attach.sendColegioConfirmation).toBeCalledWith(context, context.state.bairro);
	await expect(context.setState).toBeCalledWith({ dialog: 'confirmBairro' });
});

it('wantToTypeBairro - paqueta special case', async () => {
	const context = cont.textContext('paqueta', 'wantToType2');
	context.state.userInput = 'paqueta'; context.state.bairro = [{ bairro: 'paqueta' }]; context.state.municipiosFound = [{ regiao: 'capital', municipio: 'Rio de Janeiro' }];
	context.state.unfilteredBairros = [];	context.state.sugestaoBairro = [{ foo: 'bar' }];

	await dialogs.wantToTypeBairro(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 4).toBeFalsy();
	await expect(context.state.municipiosFound[0].regiao.toLowerCase() === 'capital' && ('centro'.includes(context.state.userInput) || 'colegio'.includes(context.state.userInput))).toBeFalsy();
	await expect('paqueta'.includes(context.state.userInput)).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ CCS: await db.getCCSsFromID(1043) });
	await expect(context.setState).toBeCalledWith({ dialog: 'nearestCouncil' });
});

it('wantToTypeBairro - regular case - not found', async () => {
	const context = cont.textContext('foobar', 'wantToType2');
	context.state.userInput = 'foobar'; context.state.bairro = []; context.state.municipiosFound = [{ regiao: 'capital', municipio: 'Rio de Janeiro' }];
	context.state.unfilteredBairros = []; 	context.state.sugestaoBairro = [{ foo: 'bar' }];

	await dialogs.wantToTypeBairro(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 4).toBeFalsy();
	await expect(context.state.municipiosFound[0].regiao.toLowerCase() === 'capital' && ('centro'.includes(context.state.userInput) || 'colegio'.includes(context.state.userInput))).toBeFalsy();

	await expect(context.setState).toBeCalledWith({ bairro: await help.findCCSBairro(context.state.municipiosFound, context.state.userInput) });
	await expect((!context.state.bairro || context.state.bairro === null || context.state.bairro.length === 0)).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'bairroNotFound' });
});

it('wantToTypeBairro - regular case - found 1 bairro', async () => {
	const context = cont.textContext('Caju', 'wantToType2');
	context.state.userInput = 'Caju'; context.state.bairro = [{ foo: 'bar' }]; context.state.municipiosFound = [{ regiao: 'capital', municipio: 'Rio de Janeiro' }];
	context.state.unfilteredBairros = [];	context.state.sugestaoBairro = [{ foo: 'bar' }];

	await dialogs.wantToTypeBairro(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 4).toBeFalsy();
	await expect(context.state.municipiosFound[0].regiao.toLowerCase() === 'capital' && ('centro'.includes(context.state.userInput) || 'colegio'.includes(context.state.userInput))).toBeFalsy();

	await expect(context.setState).toBeCalledWith({ bairro: await help.findCCSBairro(context.state.municipiosFound, context.state.userInput) });
	await expect((!context.state.bairro || context.state.bairro === null || context.state.bairro.length === 0)).toBeFalsy();
	await expect(context.state.bairro.length === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ CCS: context.state.bairro[0] });
	await expect(context.setState).toBeCalledWith({ dialog: 'nearestCouncil' });
});

it('wantToTypeBairro - regular case - found more than 1 bairro', async () => {
	const context = cont.textContext('Caju', 'wantToType2');
	context.state.userInput = 'Caju'; context.state.bairro = [{ foo: 'bar' }, { bar: 'foo' }]; context.state.municipiosFound = [{ regiao: 'capital', municipio: 'Rio de Janeiro' }];
	context.state.unfilteredBairros = [];	context.state.sugestaoBairro = [{ foo: 'bar' }];

	await dialogs.wantToTypeBairro(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 4).toBeFalsy();
	await expect(context.state.municipiosFound[0].regiao.toLowerCase() === 'capital' && ('centro'.includes(context.state.userInput) || 'colegio'.includes(context.state.userInput))).toBeFalsy();

	await expect(context.setState).toBeCalledWith({ bairro: await help.findCCSBairro(context.state.municipiosFound, context.state.userInput) });
	await expect((!context.state.bairro || context.state.bairro === null || context.state.bairro.length === 0)).toBeFalsy();
	await expect(context.state.bairro.length === 1).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(`Hmm, encontrei ${context.state.bairro.length} bairros na minha pesquisa. 🤔 `
	+ 'Me ajude a confirmar qual bairro você quer escolhendo uma das opções abaixo. ');
	await expect(attach.sendConselhoConfirmation).toBeCalledWith(context, context.state.bairro);
	await expect(context.setState).toBeCalledWith({ dialog: 'confirmBairro' });
});
