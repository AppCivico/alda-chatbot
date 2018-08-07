function quickReplyContext(payload, dialog, CCS = undefined, long_name = undefined, adress = undefined, retry_count = 0, lastActivity = new Date()) {
	return {
		state: {
			dialog,
			retry_count,
			CCS,
			userLocation: { neighborhood: { long_name } },
			adress,
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

module.exports.quickReplyContext = quickReplyContext;

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

module.exports.textContext = textContext;

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

module.exports.getAttachments = getAttachments;
