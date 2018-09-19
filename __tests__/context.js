function quickReplyContext(payload, dialog, CCS = undefined, long_name = undefined, adress = undefined, retry_count = 0, lastActivity = new Date()) {
	return {
		state: {
			dialog,
			retry_count,
			CCS,
			userLocation: { neighborhood: { long_name } },
			adress,
			geoLocation: { lat: -23.5733, long: -46.6417 },
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
		sendImage: jest.fn(),
		typingOn: jest.fn(),
		typingOff: jest.fn(),
		sendButtonTemplate: jest.fn(),
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

function getLocation(dialog, lastActivity = new Date()) {
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
			isLocation: true,
			location: {
				coordinates: { lat: -23.5733, long: -46.6417 },
			},
			rawEvent: { timestamp: new Date() },
		},
		sendText: jest.fn(),
		setState: jest.fn(),
		// resetState: jest.fn(),
		sendImage: jest.fn(),
	};
}

module.exports.getLocation = getLocation;

// mockup functions

function fakeGeo(opt) {
	return new Promise((resolve, reject) => {
		const json = {};
		json.results[0].formatted_address = 'Paraíso, São Paulo';
		if (opt.language !== 'pt-BR') reject(json);
		else resolve('There was an error');
	});
}

module.exports.fakeGeo = fakeGeo;

// db mock-up

const db = {};

async function getDiretoria(CCS_ID) {
	if (CCS_ID === true) {
		return [
			{ nome: 'George', cargo: 'Lead' },
			{ nome: 'Ringo', cargo: 'Drums' }];
	}
	return [
		{ nome: 'John', cargo: 'Singer' },
		{ nome: 'Paul', cargo: 'Bass' }];
}

db.getDiretoria = getDiretoria;

module.exports.db = db;
