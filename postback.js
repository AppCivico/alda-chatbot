const Request = require('request');

const pageToken = process.env.ACCESS_TOKEN;

function createGetStarted() {
	Request.post({
		uri: `https://graph.facebook.com/v2.6/me/messenger_profile?access_token=${pageToken}`,
		'content-type': 'application/json',
		form: {
			get_started: {
				payload: 'restart',
			},
			greeting: [
				{
					locale: 'default',
					text: 'Olá! Essa é a mensagem de Boas-vindas! Ela só aparece na janela!',
				},
			],
		},
	}, (error, response, body) => {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body);
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
							url: 'https://google.com',
						},
						{
							type: 'postback',
							title: 'Ir para o Início',
							payload: 'restart',
						},
					],
				},
			],
		},
	}, (error, response, body) => {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body);
	});
}

// Will be executed when imported
// It's being imported on index.js, should be commented out after first execution
createGetStarted();
createPersistentMenu();
