require('dotenv').config();
const { MessengerClient } = require('messaging-api-messenger');

const req = require('requisition');
const flow = require('./flow');

const config = require('./bottender.config').messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

const pageToken = process.env.ACCESS_TOKEN;

async function createGetStarted() { // eslint-disable-line no-unused-vars
	console.log(await client.setGetStarted('start'));
	console.log(await client.setGreeting([{
		locale: 'default',
		text: flow.greetings.getStarted,
	}]));
}

async function createPersistentMenu() { // eslint-disable-line no-unused-vars
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
							payload: 'councilMenu',
						},
						{
							type: 'postback',
							title: 'Trocar Conselho',
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
							payload: 'enableNotifications',
						},
						{
							type: 'postback',
							title: 'Desativar Notificações',
							payload: 'disableNotifications',
						},
					],
				},
			],
		},
	]));
}

// Each of these functions should be ran from the terminal, with all changes being made right here on the code
// Run it => node postback.js
// createGetStarted();
// createPersistentMenu();

// creates a new label. Pass in the name of the label and add the return ID to the .env file
// createNewLabel('example');
async function createNewLabel(name) { // eslint-disable-line no-unused-vars
	const res = await req.post(`https://graph.facebook.com/v2.11/me/custom_labels?access_token=${pageToken}`).query({ name });
	const response = await res.json();
	return response;
}
module.exports.createNewLabel = createNewLabel;

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

async function dissociateLabelsFromUser(UserID) {
	const userLabels = await client.getAssociatedLabels(UserID);
	if (userLabels.data) {
		await userLabels.data.forEach(async (element) => {
			await client.dissociateLabel(UserID, element.id);
		});
		return true;
	}
	return false;
}

module.exports.dissociateLabelsFromUser = dissociateLabelsFromUser;

async function addUserToBlackList(UserID) {
	return client.associateLabel(UserID, process.env.LABEL_BLACKLIST);
}

module.exports.addUserToBlackList = addUserToBlackList;

async function removeUserFromBlackList(UserID) {
	return client.dissociateLabel(UserID, process.env.LABEL_BLACKLIST);
}

module.exports.removeUserFromBlackList = removeUserFromBlackList;

async function checkUserOnLabel(UserID, labelID) { // checks if user is on the label
	const userLabels = await client.getAssociatedLabels(UserID);
	const theOneLabel = await userLabels.data.find(x => x.id === `${labelID}`); // find the one label with the name same

	if (theOneLabel) { // if we found the label on the user
		return true;
	}
	return false;
}

module.exports.checkUserOnLabel = checkUserOnLabel;

// Associates user to a label. Pass in the custom label id and the user psid
// associatesLabelToUser('123123', process.env.LABEL_ADMIN);
async function associatesLabelToUser(userID, labelID) { // eslint-disable-line no-unused-vars
	if (await checkUserOnLabel(userID, labelID) === true) {
		return true;
	}

	const userLabels = await client.getAssociatedLabels(userID);
	if (userLabels.data.length >= 20) { // actual facebook limit is 25 (by limit i mean before pagination starts to act up)
		userLabels.data.forEach(async (element) => {
			if (element.id !== process.env.LABEL_ADMIN) { // remove every tag except for admin
				client.dissociateLabel(userID, element.id);
			}
		});
	}

	return client.associateLabel(userID, labelID);
}
module.exports.associatesLabelToUser = associatesLabelToUser;

async function getLabelID(labelName) {
	const labelList = await client.getLabelList();

	const theOneLabel = await labelList.data.find(x => x.name === `${labelName}`);
	if (theOneLabel && theOneLabel.id) { // check if label exists
		return theOneLabel.id;
	}
	const newLabel = await client.createLabel(labelName);
	if (newLabel) {
		return newLabel.id;
	}
	return undefined;
}

module.exports.getLabelID = getLabelID;


// async function test() {
// 	console.log(await getLabelID('blacklist'));
// }
// test();

// const res = await req.post(`https://graph.facebook.com/v2.11/${labelID}/label?access_token=${pageToken}`).query({ user });
// const response = await res.json();
// return response;
