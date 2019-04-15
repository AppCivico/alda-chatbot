/* eslint camelcase: 0 */ // --> OFF
/* eslint no-param-reassign: 0 */ // --> OFF
const request = require('requisition');
const queryString = require('query-string');

const apiUri = process.env.APPCIVICO_API;
const security_token = process.env.SECURITY_TOKEN_APPCIVICO;

module.exports = {
	async getPoliticianData(pageId) {
		const res = await request(`${apiUri}/api/chatbot/politician?fb_page_id=${pageId}&security_token=${security_token}`);
		const politicianData = await res.json();
		// console.log('politicianData', politicianData);
		return politicianData;
	},

	async getPollData(pageId) {
		const res = await request(`${apiUri}/api/chatbot/poll?fb_page_id=${pageId}&security_token=${security_token}`);
		const pollData = await res.json();
		// console.log('pollData', pollData);
		return pollData;
	},

	async postRecipient(politician_id, recipient) {
		const recipientData_qs = queryString.stringify(recipient);
		const res = await request.post(`${apiUri}/api/chatbot/recipient?${recipientData_qs}&security_token=${security_token}&`).query({ politician_id });
		const recipientData = await res.json();
		// console.log('recipientData', recipientData);
		return recipientData;
	},

	async postRecipientLabel(politician_id, fb_id, label) {
		const recipient = {
			fb_id,
			custom_labels: [{ name: label }],
		};
		const recipientData_qs = queryString.stringify(recipient);
		const res = await request.post(`${apiUri}/api/chatbot/recipient?${recipientData_qs}&security_token=${security_token}&`).query({ politician_id });
		const recipientData = await res.json();
		// console.log('recipientData', recipientData);
		return recipientData;
	},

	async deleteRecipientLabel(politician_id, fb_id, label) {
		const recipient = {
			fb_id,
			custom_labels: [{ name: label, deleted: 1 }],
		};
		const recipientData_qs = queryString.stringify(recipient);
		const res = await request.post(`${apiUri}/api/chatbot/recipient?${recipientData_qs}&security_token=${security_token}&`).query({ politician_id });
		const recipientData = await res.json();
		// console.log('recipientData', recipientData);
		return recipientData;
	},

	async getRecipient(politician_id, fb_id) {
		const res = await request.get(`${apiUri}/api/chatbot/recipient?fb_id=${fb_id}&security_token=${security_token}&`).query({ politician_id });
		const recipientData = await res.json();
		// console.log('recipientData', recipientData);
		return recipientData;
	},

	async postPollAnswer(fb_id, poll_question_option_id, origin) {
		const res = await request.post(`${apiUri}/api/chatbot/poll-result?fb_id=${fb_id}&poll_question_option_id=${poll_question_option_id}&origin=${origin}&security_token=${security_token}`);
		const pollAnswer = await res.json();
		return pollAnswer;
	},

	async getPollAnswer(fb_id, poll_id) {
		const res = await request(`${apiUri}/api/chatbot/poll-result?fb_id=${fb_id}&poll_id=${poll_id}&security_token=${security_token}`);
		const pollAnswer = await res.json();
		return pollAnswer;
	},

	async getDialog(politician_id, dialog_name) {
		const res = await request(`${apiUri}/api/chatbot/dialog?politician_id=${politician_id}&dialog_name=${dialog_name}&security_token=${security_token}`);
		const dialog = await res.json();
		return dialog;
	},

	async getAnswer(politician_id, question_name) {
		const res = await request(`${apiUri}/api/chatbot/answer?politician_id=${politician_id}&question_name=${question_name}&security_token=${security_token}`);
		const question = await res.json();
		return question;
	},

	async postIssue(politician_id, fb_id, message, entities, issue_active) {
		if (issue_active === 1 || issue_active === true) {
			message = encodeURI(message);
			entities = JSON.stringify(entities);
			const res = await request.post(`${apiUri}/api/chatbot/issue?politician_id=${politician_id}&fb_id=${fb_id}&message=${message}&entities=${entities}&security_token=${security_token}`);
			const issue = await res.json();
			// console.log('postIssue', issue);

			return issue;
		}

		return false;
	},


	async postIssueWithoutEntities(politician_id, fb_id, message, issue_active) {
		if (issue_active === 1 || issue_active === true) {
			message = encodeURI(message);
			const res = await request.post(`${apiUri}/api/chatbot/issue?politician_id=${politician_id}&fb_id=${fb_id}&message=${message}&security_token=${security_token}`);
			const issue = await res.json();
			// console.log('postIssueWithoutEntities', issue);

			return issue;
		}

		return false;
	},

	async getknowledgeBase(politician_id, entities, fb_id) {
		entities = JSON.stringify(entities);
		const res = await request(`${apiUri}/api/chatbot/knowledge-base?politician_id=${politician_id}&entities=${entities}&fb_id=${fb_id}&security_token=${security_token}`);
		const knowledgeBase = await res.json();
		// console.log('getknowledgeBase', knowledgeBase);
		return knowledgeBase;
	},

	async getknowledgeBaseByName(politician_id, entities) {
		const res = await request(`${apiUri}/api/chatbot/knowledge-base?politician_id=${politician_id}&entities=${entities}&security_token=${security_token}`);
		const knowledgeBase = await res.json();
		// console.log('getknowledgeBaseByName', knowledgeBase);

		return knowledgeBase;
	},

	async postPrivateReply(item, page_id, post_id, comment_id, permalink, user_id) {
		const res = await request.post(`${apiUri}/api/chatbot/private-reply?page_id=${page_id}&item=${item}&post_id=${post_id}&comment_id=${comment_id}&permalink=${permalink}&user_id=${user_id}&security_token=${security_token}`);
		const privateReply = await res.json();
		// console.log('postPrivateReply', privateReply);
		return privateReply;
	},

	async updateBlacklistMA(fb_id, active) { // 0 -> turn off notification && 1 -> turn on notification
		const res = await request.post(`${apiUri}/api/chatbot/blacklist?fb_id=${fb_id}&active=${active}&security_token=${security_token}`);
		const Blacklist = await res.json();
		console.log('Blacklist', Blacklist);

		return Blacklist;
	},

	async getAvailableIntents(pageId, page) { // has pagination
		const res = await request(`${apiUri}/api/chatbot/intents/available?fb_page_id=${pageId}&page=${page}&security_token=${security_token}`);
		const intents = await res.json();
		return intents;
	},

	async getAllAvailableIntents(pageId) {
		const res = await request(`${apiUri}/api/chatbot/intents/available?fb_page_id=${pageId}&security_token=${security_token}`);
		const intents = await res.json();
		return intents;
	},

	async logFlowChange(recipient_fb_id, politician_id, payload, human_name) {
		const d = new Date();
		const res = await request.post(`${apiUri}/api/chatbot/log?security_token=${security_token}&`).query({
			timestamp: d.toGMTString(),
			recipient_fb_id,
			politician_id,
			action_id: 1,
			payload,
			human_name,
		});
		const log = await res.json();
		// // console.log('logFlowChange', log);
		return log;
	},

	async logAnsweredPoll(recipient_fb_id, politician_id, field_id) {
		const d = new Date();
		const res = await request.post(`${apiUri}/api/chatbot/log?security_token=${security_token}&`).query({
			timestamp: d.toGMTString(),
			recipient_fb_id,
			politician_id,
			action_id: 2,
			field_id,
		});
		const log = await res.json();
		// // console.log('logAnsweredPoll', log);
		return log;
	},

	async logAskedEntity(recipient_fb_id, politician_id, field_id) {
		const d = new Date();
		const res = await request.post(`${apiUri}/api/chatbot/log?security_token=${security_token}&`).query({
			timestamp: d.toGMTString(),
			recipient_fb_id,
			politician_id,
			action_id: 5,
			field_id,
		});
		const log = await res.json();
		// // console.log('logAskedEntity', log);
		return log;
	},

	async logNotification(recipient_fb_id, politician_id, action_id) {
		// action_id should be 3 for ACTIVATED_NOTIFICATIONS and 4 for DEACTIVATED_NOTIFICATIONS
		const d = new Date();
		const res = await request.post(`${apiUri}/api/chatbot/log?security_token=${security_token}&`).query({
			timestamp: d.toGMTString(),
			recipient_fb_id,
			politician_id,
			action_id,
		});
		const log = await res.json();
		// console.log('logNotification', log);
		return log;
	},

	// // console.log(await MaAPI.getLogAction()); // print possible log actions
	async getLogAction() {
		const res = await request(`${apiUri}/api/chatbot/log/actions?security_token=${security_token}`);
		const log = await res.json();
		return log;
	},

	async setIntentStatus(politician_id, recipient_fb_id, intent, entity_is_correct) {
		if (intent && intent.id) {
			const res = await request.post(`${apiUri}/api/chatbot/politician/${politician_id}/intents/${intent.id}/stats?entity_is_correct=${entity_is_correct}&recipient_fb_id=${recipient_fb_id}&security_token=${security_token}`);
			const log = await res.json();
			// // console.log('setIntentStatus', log);
			return log;
		}
		return false;
	},
};
