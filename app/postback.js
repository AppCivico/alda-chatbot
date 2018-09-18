require('dotenv').config();

const Request = require('request');
const req = require('requisition');

const pageToken = process.env.ACCESS_TOKEN;
const flow = require('./flow');

function createGetStarted() {
	Request.post({
		uri: `https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${pageToken}`,
		'content-type': 'application/json',
		form: {
			get_started: {
				payload: 'greetings',
			},
			greeting: [
				{
					locale: 'default',
					text: flow.greetings.getStarted,
				},
			],
		},
	}, (error, response, body) => {
		console.log('\nMensagem de boas-vindas:');
		console.log('error:', error);
		console.log('body:', body);
		console.log('statusCode:', response && response.statusCode);
	});
}

function createPersistentMenu() {
	Request.post({
		uri: `https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${pageToken}`,
		'content-type': 'application/json',
		form: {
			persistent_menu: [
				{
					locale: 'default',
					call_to_actions: [
						{
							type: 'web_url',
							title: 'Nosso site',
							url: 'http://www.consperj.rj.gov.br/',
						},
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
			],
		},
	}, (error, response, body) => {
		console.log('\nMenu lateral:');
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body);
	});
}

// Each of these functions should be ran from the terminal, with all changes being made right here on the code
// Run it => node postback.js
// load();
async function load() { // eslint-disable-line no-unused-vars
	await createGetStarted();
	await createPersistentMenu();
}

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

