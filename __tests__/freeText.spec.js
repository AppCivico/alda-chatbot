require('dotenv').config();

const flow = require('../app/flow');
const handler = require('../app/handler');
const cont = require('./context');

const phoneRegex = new RegExp(/^\+55\d{2}(\d{1})?\d{8}$/);

it('Free text after time limit', async () => {
	const context = cont.textContext('Vocês são de são paulo?', 'test', new Date() - (1000 * 60 * 60));
	await handler(context);
	await expect(context.sendText).toBeCalledWith(`Olá, ${context.session.user.first_name}! ${flow.greetings.comeBack}`);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});

// it('Free text to restart', async () => {
// 	const context = cont.textContext(process.env.RESTART, 'test');
// 	await handler(context);
// 	await expect(context.resetState).toBeCalledWith();
// });

it('Free text on non-specified dialog', async () => {
	const context = cont.textContext('Vocês são de são paulo?', 'test');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'errorText' });
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

it('Enter e-mail', async () => {
	const context = cont.textContext('Qualquer@coisa.vale', 'eMail');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ eMail: context.event.message.text });
	await expect(context.setState).toBeCalledWith({ dialog: 'userData' });
});

it('Enter invalid phone', async () => {
	const context = cont.textContext('119999aa-8888', 'whatsApp');
	await handler(context);

	context.state.phone = `+55${'119999aa-8888'.replace(/[- .)(]/g, '')}`;
	await expect(context.setState).toBeCalledWith({ phone: context.state.phone });
	await expect(context.state.phone).not.toMatch(phoneRegex);
	await expect(context.setState).toBeCalledWith({ phone: '', dialog: 'reAskPhone' });
});

it('Enter valid phone', async () => {
	const context = cont.textContext('11999998888', 'whatsApp');
	await handler(context);
	context.state.phone = `+55${'11999998888'.replace(/[- .)(]/g, '')}`;

	await expect(context.setState).toBeCalledWith({ phone: context.state.phone });
	await expect(phoneRegex.test(context.state.phone)).toBeTruthy();
	// await expect(context.setState).toBeCalledWith({ dialog: 'gotPhone' });
	// TODO: figure out how to regex.test
});

it('check attachment', async () => {
	const context = cont.getAttachments('test');
	await handler(context);

	await expect(context.sendImage).toBeCalledWith(flow.greetings.likeImage);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});
