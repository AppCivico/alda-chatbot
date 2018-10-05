require('dotenv').config();

const flow = require('../app/flow');
const handler = require('../app/handler');
const cont = require('./context');
const attach = require('../app/attach');
const help = require('../app/helpers');
const db = require('../app/DB_helper');

jest.mock('../app/helpers');
jest.mock('../app/DB_helper');

const phoneRegex = new RegExp(/^\+55\d{2}(\d{1})?\d{8}$/);
const mailRegex = new RegExp(/\S+@\S+/);

it('Free text after time limit', async () => {
	const context = cont.textContext('Vocês são de são paulo?', 'test', new Date() - (1000 * 60 * 60 * 12));
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
	await expect(context.setState).toBeCalledWith({ lastDialog: context.state.dialog });
	await expect(context.sendText).toBeCalledWith(`Oi, ${context.session.user.first_name}. Eu sou a Alda, uma robô 🤖 e não entendi essa sua útlima mensagem.` +
	'\nPosso te pedir um favor? Me diga o que você quer fazer clicando em uma das opções abaixo. ⬇️ ' +
	'\nSe quiser voltar para onde estava, clique em \'Voltar.\'', await attach.getErrorQR(flow.error, context.state.lastDialog));
	await expect(context.setState).toBeCalledWith({ dialog: '' });
});

it('Enter invalid email', async () => {
	const context = cont.textContext('Não é válido!', 'eMail');
	context.state.eMail = 'Não é válido!';
	await handler(context);
	await expect(context.setState).toBeCalledWith({ eMail: context.event.message.text.toLowerCase() });
	await expect(context.state.eMail).not.toMatch(mailRegex);
	await expect(context.setState).toBeCalledWith({ eMail: '', dialog: 'reAskMail' });

	context.state.dialog = 'reAskMail';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.eMail.firstMessage, await attach.getQR(flow.eMail));
});

it('Enter valid email', async () => {
	const context = cont.textContext('qualquer@coisa.com', 'eMail');
	context.state.eMail = 'qualquer@coisa.com';
	await handler(context);
	await expect(context.setState).toBeCalledWith({ eMail: context.event.message.text.toLowerCase() });
	await expect(mailRegex.test(context.state.eMail)).toBeTruthy();
	await expect(context.sendText).toBeCalledWith('Obrigada por fazer parte! Juntos podemos fazer a diferença. ❤️');
	await expect(context.setState).toBeCalledWith({ dialog: 'userData' });
	context.state.dialog = 'userData';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.userData.menuMessage, await attach.getQR(flow.userData));
});

it('Enter invalid phone', async () => {
	const context = cont.textContext('119999aa-8888', 'whatsApp');
	context.state.phone = `+55${'119999aa-8888'.replace(/[- .)(]/g, '')}`;
	await handler(context);
	await expect(context.setState).toBeCalledWith({ phone: context.state.phone });
	await expect(context.state.phone).not.toMatch(phoneRegex);
	await expect(context.setState).toBeCalledWith({ phone: '', dialog: 'reAskPhone' });

	context.state.dialog = 'reAskPhone';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.phone.firstMessage, await attach.getQR(flow.phone));
});

it('Enter valid phone', async () => {
	const context = cont.textContext('11999998888', 'whatsApp');
	context.state.phone = `+55${'11999998888'.replace(/[- .)(]/g, '')}`;
	await handler(context);
	await expect(context.setState).toBeCalledWith({ phone: context.state.phone });
	await expect(phoneRegex.test(context.state.phone)).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'gotPhone' });

	context.state.dialog = 'gotPhone';
	await handler(context);
	await expect(context.sendText).toBeCalledWith('Guardamos seu telefone! Como posso te ajudar?', await attach.getQR(flow.userData));
});

it('check attachment', async () => {
	const context = cont.getAttachments('test');
	await handler(context);
	await expect(context.sendImage).toBeCalledWith(flow.greetings.likeImage);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });

	context.state.dialog = 'mainMenu';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.mainMenu.firstMessage, await attach.getQR(flow.mainMenu));
});

it('i want to type - less than 3 chars', async () => {
	const context = cont.textContext('ab', 'wantToType1');
	context.state.userInput = 'ab';

	await handler(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 3).toBeTruthy();
	await expect(context.sendText).toBeCalledWith('Esse nome é muito curto! Desse jeito não conseguirei encontrar sua cidade. Por favor, tente de novo.');
	await expect(context.setState).toBeCalledWith({ dialog: 'wantToType1' });
});

it('i want to type - entered rio de janeiro', async () => {
	const context = cont.textContext('rio de janeiro', 'wantToType1');
	context.state.userInput = 'rio de janeiro';
	await handler(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 3).toBeFalsy();
	await expect('rio de janeiro'.includes(context.state.userInput)).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ userInput: 'capital' });
	context.state.userInput = 'capital';
	context.state.municipiosFound = { name: 'test' };
	await handler(context);
	await expect(context.setState).toBeCalledWith({ municipiosFound: await db.getCCSsFromMunicipio(context.state.userInput) });
	await expect(!context.state.municipiosFound || context.state.municipiosFound.length === 0).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ dialog: 'wantToType2' });
});

it('i want to type - entered unexistent', async () => {
	const context = cont.textContext('são paulo', 'wantToType1');
	context.state.userInput = 'são paulo';
	await handler(context);
	await expect(context.setState).toBeCalledWith({ cameFromGeo: false });
	await expect(context.setState).toBeCalledWith({ userInput: await help.formatString(context.event.message.text) });
	await expect(context.state.userInput.length < 3).toBeFalsy();
	await expect('rio de janeiro'.includes(context.state.userInput)).toBeFalsy();
	await handler(context);
	await expect(context.setState).toBeCalledWith({ municipiosFound: await db.getCCSsFromMunicipio(context.state.userInput) });
	await expect(!context.state.municipiosFound || context.state.municipiosFound.length === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'municipioNotFound' });
});

