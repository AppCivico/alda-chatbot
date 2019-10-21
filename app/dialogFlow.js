const dialogflow = require('dialogflow');
const { getknowledgeBase } = require('./chatbot_api.js');
const { createIssue } = require('./send_issue');
const { sendAnswer } = require('./sendAnswer');
const { denunciaStart } = require('./dialogs');
const dialogs = require('./dialogs');
const help = require('./helpers');

/* Initialize DialogFlow agent */
/* set GOOGLE_APPLICATION_CREDENTIALS on .env */
const sessionClient = new dialogflow.SessionsClient();
const projectId = process.env.GOOGLE_PROJECT_ID;

/**
 * Send a text query to the dialogflow agent, and return the query result.
 * @param {string} text The text to be queried
 * @param {string} sessionId A unique identifier for the given session
 */
async function textRequestDF(text, sessionId) {
	const sessionPath = sessionClient.sessionPath(projectId, sessionId);
	const request = { session: sessionPath, queryInput: { text: { text, languageCode: 'pt-BR' } } };
	const responses = await sessionClient.detectIntent(request);
	return responses;
}

async function getExistingRes(res) {
	let result = null;
	res.forEach((e) => { if (e !== null && result === null) result = e; });
	return result;
}

/**
 * Build object with the entity name and it's values from the dialogflow response
 * @param {string} res result from dialogflow request
 */
async function getEntity(res) {
	const result = {};
	const entities = res[0] && res[0].queryResult && res[0].queryResult.parameters ? res[0].queryResult.parameters.fields : [];
	if (entities) {
		Object.keys(entities).forEach((e) => {
			const aux = [];
			if (entities[e] && entities[e].listValue && entities[e].listValue.values) {
				entities[e].listValue.values.forEach((name) => { aux.push(name.stringValue); });
			}
			result[e] = aux;
		});
	}

	return result || {};
}


async function checkTextContext(context) {
	console.log('context.state.dialog', context.state.dialog);
	// if we didnt understand what was typed and the user is into one of these dialogs we must follow the rest of the flow as usual
	// it's possible that we understand what was typed, answer it and go back to the rest of the flow (not as a "text action" but simply by following the dialog)
	switch (context.state.dialog) {
	// -- case 'whichCCSMenu':
	case 'retryType':
	case 'sendLocation':
	case 'wantToChange':
	case 'municipioNotFound':
	case 'confirmMunicipio':
	case 'wantToType1': // user entered city text
		await dialogs.wantToTypeCidade(context);
		break;
	case 'bairroNotFound':
	case 'confirmBairro':
	case 'wantToType2': // user entered bairro text
		await dialogs.wantToTypeBairro(context);
		break;
	case 'reAskMail':
	case 'eMail':
		await dialogs.checkEmailInput(context);
		break;
	case 'reAskPhone':
	case 'whatsApp':
		await dialogs.checkPhoneInput(context);
		break;
	default:
		await context.setState({ knowledge: await getknowledgeBase(context.state.politicianData.user_id, await getExistingRes(context.state.apiaiResp), context.session.user.id) });
		// console.log('knowledge', context.state.knowledge);
		if (context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1) {
			console.log('Vai enviar a resposta');
			await context.setState({ intentQR: await dialogs.loadintentQR(context) });
			await sendAnswer(context);
		} else { // no answers in knowledge_base (We know the entity but admin doesn't have a position)
			await createIssue(context);
		}		break;
	}
}

async function checkPosition(context) {
	console.log('chegou no checkPosition com', context.state.intentName);
	// await context.setState({ dialog: '' });
	console.log('Dialog', context.state.dialog);


	switch (context.state.intentName) {
	case 'Greetings': // user said hi
		await context.setState({ dialog: 'greetings' });
		break;
	case 'denuncia':
		await context.setState({ denunciaText: context.state.whatWasTyped });
		await denunciaStart(context);
		break;
	case 'Fallback': // didn't understand what was typed
		await checkTextContext(context);
		break;
	default: // default acts for every intent - position on MA
		await checkTextContext(context);
		break;
	}
}

async function dialogFlow(context) {
	console.log(`\n${context.session.user.name} digitou ${context.event.message.text} - DF Status: ${context.state.politicianData.use_dialogflow}`);
	if (context.state.politicianData.use_dialogflow === 1) { // check if 'politician' is using dialogFlow
		await context.setState({ apiaiResp: await textRequestDF(await help.formatDialogFlow(context.state.whatWasTyped), context.session.user.id) });
		await context.setState({ intentName: context.state.apiaiResp[0].queryResult.intent.displayName || '' }); // intent name
		await context.setState({ resultParameters: await getEntity(context.state.apiaiResp) }); // entities
		await context.setState({ apiaiTextAnswer: context.state.apiaiResp[0].queryResult.fulfillmentText || '' }); // response text
		await checkPosition(context);
	} else {
		await context.setState({ dialog: 'createIssueDirect' });
	}
}

module.exports = { dialogFlow };
