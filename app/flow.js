// This class stores text messages, urls and quick_replies

const emoji = require('node-emoji');

module.exports = {
	greetings: {
		getStarted: 'Olá! Sou a Alda, vou te ajudar a acompanhar a segurança da sua região. Clique em começar para falar comigo',
		welcome: `Deixa eu me apresentar: eu sou Alda, a primeira robô criada para ser assistente dos Conselhos Comunitários de Segurança Pública (CCS) do RJ e ajudar na construção de uma cidade mais segura. É ótimo contar com você para isso! ${emoji.get('grin')}`,
		greetImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/32c149ee-6180-42f0-8fea-a4952686c188.jpg',
		firstMessage: 'Quer saber mais sobre mim?',
		menuOptions: ['Claro, fala mais', 'Agora não'],
		menuPostback: ['aboutMe', 'mainMenu'],
		comeBack: 'Que bom te ver novamente!',
		likeImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/a5e8ffa7-c0c6-412e-82ba-b9e127ca2f91.png',
	},
	error: {
		noText: 'Desculpe. Ainda não entendo texto, use os botões.',
	},

};

