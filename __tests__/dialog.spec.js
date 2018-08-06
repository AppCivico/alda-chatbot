require('dotenv').config();

const handler = require('../app/handler');

function textContext(text, dialog, timestamp) {
	return {
		state: {
			dialog,
		},
		session: '',
		event: {
			isMessage: true,
			isText: true,
			text,
			message: {
				text,
			},
			rawEvent: { timestamp },
		},
		sendText: jest.fn(),
		setState: jest.fn(),
		typingOn: jest.fn(),
	};
}

it('Free text on non-specified dialog', async () => {
	const context = textContext('Vocês são de são paulo ?', 'aaa', new Date());
	await handler(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'errorText' });
});
