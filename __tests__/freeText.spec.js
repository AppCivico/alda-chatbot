require('dotenv').config();

const flow = require('../app/flow');
const handler = require('../app/handler');
// const attach = require('../app/attach');

const phoneRegex = new RegExp(/^\+55\d{2}(\d{1})?\d{8}$/);

function textContext(text, dialog, lastActivity = new Date()) {
	return {
		state: {
			dialog,
		},
		session: {
			lastActivity,
			user: {
				first_name: 'Userton',
				last_name: 'McTest',
			},
		},
		event: {
			isMessage: true,
			isText: true,
			text,
			message: {
				text,
			},
			rawEvent: { timestamp: new Date() },
		},
		sendText: jest.fn(),
		setState: jest.fn(),
		resetState: jest.fn(),
		// sendImage: jest.fn(),
		// typingOn: jest.fn(),
		// typingOff: jest.fn(),
	};
}

function getAttachments(dialog, lastActivity = new Date()) {
	return {
		state: {
			dialog,
		},
		session: {
			lastActivity,
			user: {
				first_name: 'Userton',
				last_name: 'McTest',
			},
		},
		event: {
			hasAttachment: true,
			rawEvent: { timestamp: new Date() },
		},
		sendText: jest.fn(),
		setState: jest.fn(),
		// resetState: jest.fn(),
		sendImage: jest.fn(),
	};
}

it('Free text after time limit', async () => {
	const context = textContext('Vocês são de são paulo?', 'test', new Date() - (1000 * 60 * 60));
	await handler(context);
	await expect(context.sendText).toBeCalledWith(`Olá, ${context.session.user.first_name}! ${flow.greetings.comeBack}`);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});

it('Free text to restart', async () => {
	const context = textContext(process.env.RESTART, 'test');
	await handler(context);
	await expect(context.resetState).toBeCalledWith();
});

it('Free text on non-specified dialog', async () => {
	const context = textContext('Vocês são de são paulo?', 'test');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'errorText' });
});

it('Free text on wantToChange', async () => {
	const context = textContext('av. paulista', 'wantToChange');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ address: context.event.message.text });
	await expect(context.setState).toBeCalledWith({ dialog: 'confirmLocation' });
});

it('Free text on falls through', async () => {
	const context = textContext('av. paulista', 'retryType');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ address: context.event.message.text });
	await expect(context.setState).toBeCalledWith({ dialog: 'confirmLocation' });
});

it('Enter e-mail', async () => {
	const context = textContext('Qualquer@coisa.vale', 'eMail');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ eMail: context.event.message.text });
	await expect(context.setState).toBeCalledWith({ dialog: 'userData' });
});

it('Enter invalid phone', async () => {
	const context = textContext('119999aa-8888', 'whatsApp');
	await handler(context);

	const aux = `+55${context.event.message.text.replace(/[- .)(]/g, '')}`;
	await expect(context.setState).toBeCalledWith({ phone: aux });
	await expect(aux).not.toMatch(phoneRegex);
	await expect(context.setState).toBeCalledWith({ phone: '', dialog: 'reAskPhone' });
});

it('Enter valid phone', async () => {
	const context = textContext('1199999-8888', 'whatsApp');
	await handler(context);

	const aux = `+55${context.event.message.text.replace(/[- .)(]/g, '')}`;
	await expect(context.setState).toBeCalledWith({ phone: aux });
	await expect(aux).toMatch(phoneRegex);
	// await expect(context.setState).toBeCalledWith({ dialog: 'gotPhone' });
	// TODO: figure out how to regex.test
});

it('check attachment', async () => {
	const context = getAttachments('test');
	await handler(context);

	await expect(context.sendImage).toBeCalledWith(flow.greetings.likeImage);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});
