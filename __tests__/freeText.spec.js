require('dotenv').config();

const flow = require('../app/flow');
const handler = require('../app/handler');
const cont = require('./context');
const attach = require('../app/attach');

const phoneRegex = new RegExp(/^\+55\d{2}(\d{1})?\d{8}$/);
const addressComplement = process.env.PROCESS_COMPLEMENT; // => "state, country"
const defaultAddress = process.env.DEFAULT_ADDRESS;

// it('Free text to restart', async () => {
// 	const context = cont.textContext(process.env.RESTART, 'test');
// 	await handler(context);
// 	await expect(context.resetState).toBeCalledWith();
// });

it('Free text after time limit', async () => {
	const context = cont.textContext('Vocês são de são paulo?', 'test', new Date() - (1000 * 60 * 60));
	await handler(context);
	await expect(context.sendText).toBeCalledWith(`Olá, ${context.session.user.first_name}! ${flow.greetings.comeBack}`);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });

	context.state.dialog = 'mainMenu';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.mainMenu.firstMessage, await attach.getQR(flow.mainMenu));
});

it('Free text on non-specified dialog', async () => {
	const context = cont.textContext('Vocês são de são paulo?', 'test');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'errorText' });

	context.state.dialog = 'errorText';
	await handler(context);
	await expect(context.sendButtonTemplate).toBeCalledWith(`Oi, ${context.session.user.first_name} ${context.session.user.last_name}.${flow.error.noText}`, [{
		type: 'postback',
		title: flow.error.menuOptions[0],
		payload: flow.error.menuPostback[0],
	}]);
});

it('Free text on wantToChange', async () => {
	const context = cont.textContext('av. paulista', 'wantToChange');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ address: context.event.message.text });
	await expect(context.setState).toBeCalledWith({ dialog: 'confirmLocation' });
});

it('Free text on falls through', async () => {
	const context = cont.textContext('av. paulista', 'retryType');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ address: context.event.message.text });
	await expect(context.setState).toBeCalledWith({ dialog: 'confirmLocation' });
});

it('wantToType-send free text', async () => {
	const context = cont.textContext('Caju', 'wantToType');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ address: context.event.message.text });
	await expect(context.setState).toBeCalledWith({ dialog: 'confirmLocation' });
});

it('sendLocation-send free text - confirmLocation', async () => {
	const context = cont.textContext('Caju', 'sendLocation');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ address: context.event.message.text });
	await expect(context.setState).toBeCalledWith({ dialog: 'confirmLocation' });

	// testing confirmLocation
	context.state.address = context.event.message.text;
	context.state.dialog = 'confirmLocation';
	await handler(context);
	await expect(context.typingOn).toBeCalledWith();
	cont.fakeGeo({
		address: `${context.state.address}, ${addressComplement}`,
		region: 'BR',
		language: 'pt-BR',
	}).then(async (response) => {
		await expect(response.json.results[0].formatted_address.trim()).not.toEqual(defaultAddress);
		// TODO the rest here
	}).catch(() => { });
});

it('Enter e-mail', async () => {
	const context = cont.textContext('Qualquer@coisa.vale', 'eMail');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ eMail: context.event.message.text });
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
