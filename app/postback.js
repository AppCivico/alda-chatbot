require('dotenv').config();

const req = require('requisition');
const { MessengerClient } = require('messaging-api-messenger');
const config = require('./bottender.config').messenger;
const flow = require('./flow');

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

const pageToken = process.env.ACCESS_TOKEN;
// const flow = require('./flow');

async function createGetStarted() {
	console.log(await client.setGetStarted('greetings'));
	console.log(await client.setGreeting([{
		locale: 'default',
		text: flow.greetings.getStarted,
	}]));
}

async function createPersistentMenu() {
	console.log(await client.setPersistentMenu([
		{
			locale: 'default',
			call_to_actions: [
				{
					type: 'web_url',
					title: 'Nosso site',
					url: 'http://www.consperj.rj.gov.br/',
				},
				{
					type: 'nested',
					title: 'Menus',
					call_to_actions: [
						{
							type: 'postback',
							title: 'Ir para o Início',
							payload: 'greetings',
						},
						{
							type: 'postback',
							title: 'Meu Conselho',
							payload: 'whichCCSMenu',
						},
					],
				},
				{
					type: 'nested',
					title: 'Notificações',
					call_to_actions: [
						{
							type: 'postback',
							title: 'Ativar Notificações',
							payload: 'greetings',
						},
						{
							type: 'postback',
							title: 'Ativar Notificações',
							payload: 'whichCCSMenu',
						},
					],
				},

			],
		},
	]));
}

// Each of these functions should be ran from the terminal, with all changes being made right here on the code
// Run it => node postback.js
createGetStarted();
createPersistentMenu();


// creates a new label. Pass in the name of the label and add the return ID to the .env file
// createNewLabel('example');
async function createNewLabel(name) { // eslint-disable-line no-unused-vars
	const res = await req.post(`https://graph.facebook.com/v2.11/me/custom_labels?access_token=${pageToken}`).query({ name });
	const response = await res.json();
	return response;
}
module.exports.createNewLabel = createNewLabel;


// Associates user to a label. Pass in the custom label id and the user psid
// associatesLabelToUser(process.env.LABEL_ADMIN, '123123');
async function associatesLabelToUser(labelID, user) { // eslint-disable-line no-unused-vars
	const res = await req.post(`https://graph.facebook.com/v2.11/${labelID}/label?access_token=${pageToken}`).query({ user });
	const response = await res.json();
	return response;
}
module.exports.associatesLabelToUser = associatesLabelToUser;

// get every label
async function listAllLabels() { // eslint-disable-line no-unused-vars
	const res = await req.get(`https://graph.facebook.com/v2.11/me/custom_labels?fields=name&access_token=${pageToken}`);
	const response = await res.json();
	return response;
}
module.exports.listAllLabels = listAllLabels;

async function getBroadcastMetrics(broadcastID) {
	const res = await req.get(`https://graph.facebook.com/v2.11/${broadcastID}/insights/messages_sent?access_token=${pageToken}`);
	const response = await res.json();
	return response;
}

module.exports.getBroadcastMetrics = getBroadcastMetrics;

