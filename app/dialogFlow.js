const { getknowledgeBase } = require('./chatbot_api.js');
const { createIssue } = require('./send_issue');
const { sendAnswer } = require('./sendAnswer');

async function checkPosition(context) {
	console.log('chegou no checkPosition com', context.state.intentName);

	switch (context.state.intentName) {
	case 'Greetings': // user said hi
		await context.setState({ dialog: 'greetings' });
		break;
	case 'Fallback': // didn't understand what was typed
		await createIssue(context);
		break;
	default: // default acts for every intent - position on MA
		await context.setState({ knowledge: await getknowledgeBase(context.state.politicianData.user_id, context.state.apiaiResp, context.session.user.id) });
		// console.log('knowledge', context.state.knowledge);
		// check if there's at least one answer in knowledge_base
		if (context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1) {
			console.log('Vai enviar a resposta');

			await sendAnswer(context);
		} else { // no answers in knowledge_base (We know the entity but admin doesn't have a position)
			await createIssue(context);
		}
		break;
	}
}

module.exports.checkPosition = checkPosition;
