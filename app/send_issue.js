const { formatString } = require('./helpers');
const chatbotAPI = require('./chatbot_api.js');
const attach = require('./attach');
const flow = require('./flow');

const blacklist = ['sim', 'nao'];

// check if we should create an issue with that text message.If it returns true, we send the appropriate message.
async function createIssue(context) {
	console.log('Vai enviar pra caixa de entrada');

	let text = `Oi, ${context.session.user.first_name}. Eu sou a Alda, uma robô 🤖 e não entendi essa sua útlima mensagem.`
    + '\nPosso te pedir um favor? Me diga o que você quer fazer clicando em uma das opções abaixo. ⬇️ '
    + '\nSe quiser voltar para onde estava, clique em \'Voltar.\'';

	// check if text is not empty and not on the blacklist
	const cleanString = await formatString(context.state.whatWasTyped);
	if (cleanString && cleanString.length > 0 && !blacklist.includes(cleanString)) {
		const issueResponse = await chatbotAPI.postIssue(context.state.politicianData.user_id, context.session.user.id, context.state.whatWasTyped,
			context.state.resultParameters ? context.state.resultParameters : {}, context.state.politicianData.issue_active);

		if (issueResponse && issueResponse.id) { // saved issue
			console.log('Conseguiu enviar');

			text = flow.denunciaMenu.denunciaNot;
		}
	}

	await context.sendText(text, await attach.getErrorQR(flow.error, context.state.lastDialog));
}
module.exports.createIssue = createIssue;
