// This class stores text messages, urls and quick_replies

const emoji = require('node-emoji');

module.exports = {
	greetings: {
		getStarted: 'Olá! Sou a Alda, vou te ajudar a acompanhar a segurança da sua região. Clique em começar para falar comigo',
		welcome: 'Deixa eu me apresentar: eu sou Alda, a primeira robô criada para ser assistente dos Conselhos Comunitários de Segurança Pública (CCS) do RJ e' +
		`ajudar na construção de uma cidade mais segura. É ótimo contar com você para isso! ${emoji.get('smiley')}`,
		greetImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/32c149ee-6180-42f0-8fea-a4952686c188.jpg',
		firstMessage: 'Quer saber mais sobre mim?',
		menuOptions: ['Claro, fala mais', 'Agora não'],
		menuPostback: ['aboutMe', 'mainMenu'],
		comeBack: 'Que bom te ver novamente!',
		likeImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/a5e8ffa7-c0c6-412e-82ba-b9e127ca2f91.png',
	},
	aboutMe: {
		firstMessage: `Oba ${emoji.get('grinning')}\n` +
		'Então, eu fui desenvolvida pelo Instituto de Segurança Pública (ISP), em parceria com o Instituto de Tecnologia e Sociedade do Rio (ITS Rio) ' +
		'e o Centro de Estudos de Segurança e Cidadania (Cesec). \nEu tô aqui para te ajudar a conhecer melhor o seu Conselho Comunitário de Segurança: ' +
		'data, local e pautas das reuniões, mostrar os problemas que estão sendo resolvidos e também fazer com que as suas sugestões sejam ouvidas.',
		secondMessage: 'Ah, importante falar que as suas respostas são totalmente seguras e serão vistas apenas pelo ISP, ITS Rio e Cesec para que a sua ' +
		`opinião seja ouvida. ${emoji.get('wink')} \nÉ um enorme prazer poder conversar com você!`,
		thirdMessage: 'Quer saber o que são os Conselhos Comunitários de Segurança?',
		menuOptions: ['Claro, me conta!', 'Agora não'],
		menuPostback: ['whichCCS', 'mainMenu'],
	},
	whichCCS: {
		firstMessage: 'Os Conselhos Comunitários de Segurança são espaços onde as pessoas levam os problemas de segurança nos seus bairros e soluções para reduzir ' +
		'a violência e a criminalidade. São debates entre os moradores e as polícias civil e militar do RJ.',
		secondMessage: 'Veja os Conselhos que existem no estado:',
		CSSImage: 'https://scontent.fcgh9-1.fna.fbcdn.net/v/t1.15752-9/34072623_365710203936336_4290997827095494656_n.jpg?_nc_cat=0&_nc_eui2=AeEkeMFw8FUYVOWc8Wog_tQznUM83l4JSI-B1esmOAcRKYZ8lp2x5jCX5OdzZaV9zp0F4NV0ufGe-be6LdXGhFMv8VVWAQOzh2mveowAXlRcdA&oh=ded50dc788ad92a8d66a8df2ec510822&oe=5BA70F73',
		thirdMessage: 'Quer saber sobre o Conselho mais próximo de você?',
		menuOptions: ['Sim!', 'Quero Digitar', 'Agora não'],
		menuPostback: ['nearestCouncil', 'wantToType', 'mainMenu'],
	},
	error: {
		noText: 'Desculpe. Ainda não entendo texto, use os botões.',
	},

};

