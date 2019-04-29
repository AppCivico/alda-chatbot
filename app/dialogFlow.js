const { getknowledgeBase } = require('./chatbot_api.js');
const { createIssue } = require('./send_issue');
const { sendAnswer } = require('./sendAnswer');
// const { denunciaStart } = require('./dialogs');
const dialogs = require('./dialogs');

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
		await createIssue(context);
		break;
	}
}

module.exports.checkPosition = async (context) => {
	console.log('chegou no checkPosition com', context.state.intentName);
	// await context.setState({ dialog: '' });

	switch (context.state.intentName) {
	case 'Greetings': // user said hi
		await context.setState({ dialog: 'greetings' });
		break;
		// case 'denuncia':
		// 	await context.setState({ denunciaText: context.state.whatWasTyped });
		// 	await denunciaStart(context);
		// break;
	case 'Fallback': // didn't understand what was typed
		await checkTextContext(context);
		break;
	default: // default acts for every intent - position on MA
		await context.setState({ knowledge: await getknowledgeBase(context.state.politicianData.user_id, context.state.apiaiResp, context.session.user.id) });
		// console.log('knowledge', context.state.knowledge);
		if (context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1) { // check if there's at least one answer in knowledge_base
			console.log('Vai enviar a resposta');
			await context.setState({ intentQR: await dialogs.loadintentQR(context) });
			await sendAnswer(context);
		} else { // no answers in knowledge_base (We know the entity but admin doesn't have a position)
			await createIssue(context);
		}
		break;
	}
};

// agradecimento - voltar para o menu
