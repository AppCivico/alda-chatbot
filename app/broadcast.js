
const { MessengerClient } = require('messaging-api-messenger');

const config = require('./bottender.config').messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

// sends to the user a notification warning him that one non-active ccs he once searched is now active
// USER_ID = context-id of user
// ccs_name = name of said ccs
// bairros = array of bairros that are also part of this ccs (maybe there's only one bairro)
module.exports.sendActivatedNotification = async function sendActivatedNotification(USER_ID, ccsName, bairros) {
	let textMsg = '';

	if (bairros.length === 0) { // just to be safe
		textMsg = `Olá, o ${ccsName} se encontra agora ativo.`;
	} else if (bairros.length === 1) {
		textMsg = `Olá, o ${ccsName} se encontra agora ativo. Este conselho encobre o bairro ${bairros[0]}.`;
	} else {
		textMsg = `Olá, o ${ccsName} se encontra agora ativo. Este conselho os bairros ${bairros.join(', ').replace(/,(?=[^,]*$)/, ' e')}.`;
	}

	const response = await client.sendText(USER_ID, textMsg, {
		quick_replies: [
			{
				content_type: 'text',
				title: 'Entendi',
				payload: 'whichCCSMenu',
			},
		],
	}).then(resp => // eslint-disable-line no-unused-vars
		true).catch((error) => {
		// console.log(error); // formatted error message
		// console.log(error.stack); // error stack trace
		// console.log(error.config); // axios request config
		// console.log(error.request); // HTTP request
		console.log(error.response); // HTTP response
		return false;
	});

	return response;
};
