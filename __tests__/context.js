function quickReplyContext(payload, dialog, CCS, bairro, adress, retry_count = 0, lastActivity = new Date()) {
	return {
		state: {
			apiaiResp: { result: { parameters: [], metadata: { intentName: '' } } },
			dialog,
			retry_count,
			CCS,
			bairro,
			adress,
			geoLocation: { lat: -23.5733, long: -46.6417 },
			lastQRpayload: payload,
			politicianData: { user_id: 2000, use_dialogflow: 1, id: 1000 },
		},
		session: {
			lastActivity,
			user: {
				first_name: 'Userton',
				last_name: 'McTest',
				id: 1000,
			},
		},
		event: {
			isQuickReply: true,
			quickReply: { payload },
			message: {
				quickReply: { payload },
				text: 'This qr was clicked',
			},
			rawEvent: { timestamp: new Date(), recipient: { id: 1000 } },
		},
		sendText: jest.fn(),
		sendButtonTemplate: jest.fn(),
		sendAttachment: jest.fn(),
		setState: jest.fn(),
		resetState: jest.fn(),
		sendImage: jest.fn(),
		sendVideo: jest.fn(),
		sendAudio: jest.fn(),
		typingOn: jest.fn(),
		typingOff: jest.fn(),
	};
}
module.exports.quickReplyContext = quickReplyContext;

function textContext(text, dialog, lastActivity = new Date()) {
	return {
		state: {
			apiaiResp: { result: { parameters: [], metadata: { intentName: '' } } },
			dialog,
			politicianData: { user_id: 2000, use_dialogflow: 1, id: 1000 },
		},
		session: {
			lastActivity,
			user: {
				first_name: 'Userton',
				last_name: 'McTest',
				id: 1000,
			},
		},
		event: {
			isMessage: true,
			isText: true,
			text,
			message: {
				text,
			},
			rawEvent: { timestamp: new Date(), recipient: { id: 1000 } },
		},
		sendText: jest.fn(),
		sendButtonTemplate: jest.fn(),
		sendAttachment: jest.fn(),
		setState: jest.fn(),
		resetState: jest.fn(),
		sendImage: jest.fn(),
		sendVideo: jest.fn(),
		sendAudio: jest.fn(),
		typingOn: jest.fn(),
		typingOff: jest.fn(),
	};
}

module.exports.textContext = textContext;

function getAttachments(dialog, lastActivity = new Date()) {
	return {
		state: {
			dialog,
			politicianData: { user_id: 2000, use_dialogflow: 1, id: 1000 },
		},
		session: {
			lastActivity,
			user: {
				first_name: 'Userton',
				last_name: 'McTest',
				id: 1000,
			},
		},
		event: {
			hasAttachment: true,
			rawEvent: { timestamp: new Date(), recipient: { id: 1000 } },
		},
		sendText: jest.fn(),
		sendButtonTemplate: jest.fn(),
		sendAttachment: jest.fn(),
		setState: jest.fn(),
		resetState: jest.fn(),
		sendImage: jest.fn(),
		sendVideo: jest.fn(),
		sendAudio: jest.fn(),
		typingOn: jest.fn(),
		typingOff: jest.fn(),
	};
}

module.exports.getAttachments = getAttachments;

function getLocation(dialog, lastActivity = new Date()) {
	return {
		state: {
			dialog,
			politicianData: {
				user_id: 2000,
				use_dialogflow: 1,
				id: 1000,
			},
		},
		session: {
			lastActivity,
			user: {
				first_name: 'Userton',
				last_name: 'McTest',
				id: 1000,
			},
		},
		event: {
			isLocation: true,
			location: {
				coordinates: { lat: -23.5733, long: -46.6417 },
			},
			rawEvent: { timestamp: new Date(), recipient: { id: 1000 } },
		},
		sendText: jest.fn(),
		sendButtonTemplate: jest.fn(),
		sendAttachment: jest.fn(),
		setState: jest.fn(),
		resetState: jest.fn(),
		sendImage: jest.fn(),
		sendVideo: jest.fn(),
		sendAudio: jest.fn(),
		typingOn: jest.fn(),
		typingOff: jest.fn(),
	};
}

module.exports.getLocation = getLocation;

// mockup functions

function fakeGeo(opt) {
	return new Promise((resolve, reject) => {
		let json = {};
		json = { long_name: 'Paraíso, São Paulo' };
		if (opt.language !== 'pt-BR') {
			reject();
		} else {
			resolve(json);
		}
	});
}

module.exports.fakeGeo = fakeGeo;

// db mock-up

const db = {
	getDiretoria: async (CCS_ID) => {
		if (CCS_ID === true) {
			return [
				{ nome: 'George', cargo: 'Lead' },
				{ nome: 'Ringo', cargo: 'Drums' }];
		}
		return [
			{ nome: 'John', cargo: 'Singer' },
			{ nome: 'Paul', cargo: 'Bass' }];
	},
	getCCSsFromMunicipio: jest.fn(),
};

module.exports.db = db;

const help = {
	formatString: text => text.toLowerCase(),
};
module.exports.help = help;
