require('dotenv').config();

const flow = require('../app/flow');
const handler = require('../app/handler');
const attach = require('../app/attach');

function quickReplyContext(payload, dialog, lastActivity = new Date()) {
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
			isQuickReply: true,
			quickReply: { payload },
			message: {
				quickReply: { payload },

				text: 'This qr was clicked',
			},
			rawEvent: { timestamp: new Date() },
		},
		sendText: jest.fn(),
		setState: jest.fn(),
		resetState: jest.fn(),
		sendImage: jest.fn(),
		typingOn: jest.fn(),
		typingOff: jest.fn(),
	};
}

it('aboutMe-Claro', async () => {
	const context = quickReplyContext(flow.greetings.menuPostback[0], 'aboutMe');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.secondMessage);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.thirdMessage, await attach.getQR(flow.aboutMe));
});

it('aboutMe-Agora Não', async () => {
	const context = quickReplyContext(flow.greetings.menuPostback[1], 'aboutMe');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.notNow);
	await expect(context.setState).toBeCalledWith({ dialog: 'aboutMeMenu' });
});

it('whichCCS-Claro', async () => {
	const context = quickReplyContext(flow.aboutMe.menuPostback[0], 'whichCCS');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.secondMessage);
	await expect(context.typingOn).toBeCalledWith();
	await expect(context.sendImage).toBeCalledWith(flow.whichCCS.CCSImage);
	await expect(context.typingOff).toBeCalledWith();
});

it('whichCCS-Agora Não', async () => {
	const context = quickReplyContext(flow.aboutMe.menuPostback[1], 'whichCCS');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.notNow);
	await expect(context.setState).toBeCalledWith({ dialog: 'whichCCSMenu' });
});

