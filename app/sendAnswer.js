const MaAPI = require('./chatbot_api');
const { createIssue } = require('./send_issue');

module.exports.sendAnswer = async (context) => { // send answer from posicionamento
	// await context.setState({ currentTheme: await context.state.knowledge.knowledge_base.find(x => x.type === 'posicionamento') });
	await context.typingOn();
	await context.setState({ currentTheme: await context.state.knowledge.knowledge_base[0] });

	// console.log('currentTheme', currentTheme);
	if (context.state.currentTheme && (context.state.currentTheme.answer
        || (context.state.currentTheme.saved_attachment_type !== null && context.state.currentTheme.saved_attachment_id !== null))) {
		await MaAPI.setIntentStatus(context.state.politicianData.user_id, context.session.user.id, context.state.currentIntent, 1);
		await MaAPI.logAskedEntity(context.session.user.id, context.state.politicianData.user_id, context.state.currentTheme.entities[0].id);

		if (context.state.currentTheme.answer) { // if there's a text asnwer we send it
			await context.sendText(context.state.currentTheme.answer, context.state.intentQR);
		}
		if (context.state.currentTheme.saved_attachment_type === 'image') { // if attachment is image
			await context.sendImage({ attachment_id: context.state.currentTheme.saved_attachment_id });
		}
		if (context.state.currentTheme.saved_attachment_type === 'video') { // if attachment is video
			await context.sendVideo({ attachment_id: context.state.currentTheme.saved_attachment_id });
		}
		if (context.state.currentTheme.saved_attachment_type === 'audio') { // if attachment is audio
			await context.sendAudio({ attachment_id: context.state.currentTheme.saved_attachment_id });
		}
		await context.typingOff();
	} else { // in case there's an error
		await createIssue(context);
	}
};
