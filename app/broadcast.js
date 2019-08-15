require('dotenv').config();

const { MessengerClient } = require('messaging-api-messenger');

const config = require('./bottender.config').messenger;
const { broadcastMenu } = require('./flow');
const { getLabelID } = require('./helpers');

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

const { sequencia } = require('./flow');

// sends to the user a notification warning him that one non-active ccs he once searched is now active
// USER_ID = context-id of user
// ccs_name = name of said ccs
// bairros = array of bairros that are also part of this ccs (maybe there's only one bairro)
module.exports.sendActivatedNotification = async (USER_ID, ccsName, bairros) => {
	let textMsg = '';
	const textTwo = 'se encontra agora ativo. Quando você buscou informações sobre este conselho ele não estava ativo mas agora ele está pronto para te ouvir.';
	if (bairros.length === 0) { // just to be safe
		textMsg = `Olá, o ${ccsName} ${textTwo}`;
	} else if (bairros.length === 1) {
		textMsg = `Olá, o ${ccsName} ${textTwo} Este conselho encobre o bairro ${bairros[0]}.`;
	} else {
		textMsg = `Olá, o ${ccsName} ${textTwo} Este conselho encobre os bairros ${bairros.join(', ').replace(/,(?=[^,]*$)/, ' e')}.`;
	}
	const response = await client.sendText(USER_ID, textMsg, {
		quick_replies: [
			{
				content_type: 'text',
				title: 'Entendi',
				payload: 'advance',
			},
			{
				content_type: 'text',
				title: 'Sobre o Conselho',
				payload: 'councilMenu',
			},
		],
	}).then(resp => true).catch((error) => { // eslint-disable-line no-unused-vars
		console.log(error.stack); // error stack trace
		// console.log(error); // formatted error message
		// console.log(error.config); // axios request config
		// console.log(error.request); // HTTP request
		// console.log(error.response); // HTTP response
		return false;
	});

	return response;
};


// sends to the user a notification warning him that the agenda he once saw has changed
// USER_ID = context-id of user
// dataHora = The new date-time for the reunion/agenda
// address = The new place the reunion will take place
// ccsName = the name of said CCS
module.exports.sendAgendaNotification = async (USER_ID, message) => {
	const response = await client.sendText(USER_ID, message, {
		quick_replies: [
			{
				content_type: 'text',
				title: 'Entendi',
				payload: 'councilMenu',
			},
		],
	}).then(resp => true).catch((error) => { // eslint-disable-line no-unused-vars
		console.log(error.response); // HTTP response
		return false;
	});

	return response;
};

// creates and send an admin broadcast
module.exports.sendAdminBroadcast = async (text, label) => {
	const labelID = await getLabelID(label);
	const results = await client.createMessageCreative([
		{
			text,
			quick_replies: broadcastMenu,
			// fallback_text: 'Hello friend!',
		},
	]).then(async (result) => {
		const broadcastResult = await client.sendBroadcastMessage(result.message_creative_id, { custom_label_id: labelID });
		return broadcastResult;
	}).catch((error) => {
		console.log("Couldn't create new message => ", error);
		return error;
	});

	if (results.broadcast_id) {
		return results;
	}
	return results; // error
};

// sendAdminBroadcast('test', process.env.LABEL_ADMIN);

// creates and send an admin broadcast
module.exports.sendEnqueteParticipacao = async (USER_ID, agendaID, userName) => {
	let textToSend = sequencia[1].question;
	if (userName && userName.length > 0) { // if we have an user name, replace <nome> with the username but only what comes before the first whitespace (he first name)
		textToSend = textToSend.replace('<nome>', userName.split(' ')[0]);
	} else {
		textToSend = textToSend.replace(', <nome>', ''); // else remove <nome> and comma
	}

	const response = await client.sendText(USER_ID, textToSend, {
		quick_replies: [
			{
				content_type: 'text',
				title: sequencia[1].menuOptions[0],
				payload: `${sequencia[1].menuPostback[0]}${agendaID}`,
			},
			{
				content_type: 'text',
				title: sequencia[1].menuOptions[1],
				payload: `${sequencia[1].menuPostback[1]}${agendaID}`,
			},
		],
	}).then(resp => true).catch((error) => { // eslint-disable-line no-unused-vars
		console.log(error.stack); // error stack trace
		// console.log(error); // formatted error message
		// console.log(error.config); // axios request config
		// console.log(error.request); // HTTP request
		// console.log(error.response); // HTTP response
		return false;
	});

	return response;
};
