const request = require('request');

async function addCustomAction(recipientId) {
	request.post({
		url: `https://graph.facebook.com/${process.env.APP_ID}/activities`,
		form: {
			event: 'CUSTOM_APP_EVENTS',
			custom_events: JSON.stringify([{
				_eventName: 'user_started',
			}]),
			advertiser_tracking_enabled: 0,
			application_tracking_enabled: 0,
			extinfo: JSON.stringify(['mb1']),
			page_id: process.env.PAGE_ID,
			page_scoped_user_id: recipientId,
		},
	}, (err, httpResponse, body) => {
		console.error(err);
		console.log(httpResponse.statusCode);
		console.log(body);
	});
}

module.exports.addCustomAction = addCustomAction;
