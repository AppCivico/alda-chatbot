require('dotenv').config();

const cont = require('./context');
const flow = require('../app/flow');
const handler = require('../app/handler');
const attach = require('../app/attach');
const events = require('../app/events');
const { createIssue } = require('../app/send_issue');
// const appcivicoApi = require('../app/chatbot_api');
const { checkPosition } = require('../app/dialogFlow');
const help = require('../app/helpers');
const { apiai } = require('../app/helpers');
const dialogs = require('../app/dialogs');
// const metric = require('../app/DB_metrics');
const db = require('../app/DB_helper');

jest.mock('../app/attach');
jest.mock('../app/DB_helper');
jest.mock('../app/DB_metrics');
jest.mock('../app/helpers');
jest.mock('../app/broadcast');
jest.mock('../app/events');
jest.mock('../app/chatbot_api');
jest.mock('../app/send_issue');
jest.mock('../app/dialogFlow');
jest.mock('../app/dialogs');

it('Free text after time limit', async () => {
	const context = cont.textContext('Vocês são de são paulo?', 'test', new Date() - (1000 * 60 * 60 * 24 * 3));
	await handler(context);
	await expect(context.sendText).toBeCalledWith(`Olá, ${context.session.user.first_name}! ${flow.greetings.comeBack}`);
	await expect(context.setState).toBeCalledWith({ dialog: 'whichCCSMenu' });

	context.state.dialog = 'whichCCSMenu';
	await handler(context);
	await context.setState({ retryCount: 0 });
});

it('Free text on non-specified dialog', async () => {
	const context = cont.textContext('Vocês são de são paulo?', 'test');
	await handler(context);

	await expect(context.setState).toBeCalledWith({ lastDialog: context.state.dialog, whatWasTyped: context.event.message.text });
	await expect(context.state.politicianData.use_dialogflow === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({
		apiaiResp: await apiai.textRequest(await help.formatDialogFlow(context.state.whatWasTyped),
			{ sessionId: context.session.user.id }),
	});

	// await expect(context.setState).toBeCalledWith({ resultParameters: context.state.apiaiResp.result.parameters });
	await expect(context.setState).toBeCalledWith({ intentName: context.state.apiaiResp.result.metadata.intentName });
	await expect(checkPosition).toBeCalledWith(context);
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Texto nao interpretado');
});

it('Free text without DF', async () => {
	const context = cont.textContext('Vocês são de são paulo?', 'test');
	context.state.politicianData = { use_dialogflow: 0 };
	await handler(context);

	await expect(context.setState).toBeCalledWith({ lastDialog: context.state.dialog, whatWasTyped: context.event.message.text });
	await expect(context.state.politicianData.use_dialogflow === 1).toBeFalsy();
	await expect(createIssue).toBeCalledWith(context);
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Texto nao interpretado');
});


it('check attachment', async () => {
	const context = cont.getAttachments('');
	await handler(context);
	await expect(context.sendImage).toBeCalledWith(flow.greetings.likeImage);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });

	context.state.dialog = 'mainMenu';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.mainMenu.firstMessage, await attach.getQR(flow.mainMenu));
});

it('askPauta', async () => {
	const context = cont.textContext('Sugiro foobar', 'askPauta'); context.state.CCS = { id: 49 };

	await handler(context);
	await expect(db.savePautaSugestao).toBeCalledWith(context.session.user.id, context.state.CCS.id, context.event.message.text);
	await expect(context.sendText).toBeCalledWith(flow.pautas.askPauta2);
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario deixou sugestao');
	await expect(context.setState).toBeCalledWith({ dialog: 'subjectsFollowUp' });
});

it('sequence - on question 4', async () => {
	const context = cont.textContext('foobar', 'sequence'); context.state.questionNumber = '4';

	await handler(context);
	await expect(context.state.questionNumber === '4' || context.state.questionNumber === '7').toBeTruthy();
	await expect(context.setState).toBeCalledWith({ seqInput: context.event.message.text, dialog: 'endSequence' });

	context.state.dialog = 'endSequence';
	await handler(context);

	await expect(db.saveSeqAnswer).toBeCalledWith(context.session.user.id, context.state.agendaId, context.state.seqAnswers, context.state.seqInput);
	await expect(context.sendText).toBeCalledWith(flow.sequencia[context.state.questionNumber].followUp);
	await expect(dialogs.sendCouncilMenu).toBeCalledWith(context);
});

it('wantToType1 - less than 3 tries ', async () => {
	const context = cont.textContext('asd', 'wantToType1');

	await handler(context);
	await expect(context.setState).toBeCalledWith({ geoLocation: undefined, bairro: undefined });
	await expect(context.setState).toBeCalledWith({ retryCount: context.state.retryCount + 1 });
	await expect(context.state.retryCount > 3).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.wantToType.firstMessage);
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Pedimos Cidade ao Usuario');
});

it('wantToType1 - more than 3 tries ', async () => {
	const context = cont.textContext('asd', 'wantToType1');
	context.state.retryCount = 4;

	await handler(context);
	await expect(context.setState).toBeCalledWith({ geoLocation: undefined, bairro: undefined });
	await expect(context.setState).toBeCalledWith({ retryCount: context.state.retryCount + 1 });
	await expect(context.state.retryCount > 3).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ retryCount: 0 });
	await expect(context.sendText).toBeCalledWith(`${flow.wantToType.firstMessage}\n${flow.wantToChange.helpMessage}`, await attach.getQR(flow.wantToChange));
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Pedimos Cidade ao Usuario');
});
