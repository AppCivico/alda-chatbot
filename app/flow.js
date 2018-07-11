// This class stores text messages, urls and quick_replies

// const emoji = require('node-emoji');

module.exports = {
	greetings: {
		getStarted: 'Olá! Sou a Alda, vou te ajudar a acompanhar a segurança da sua região. Clique em começar para falar comigo',
		welcome: 'Deixa eu me apresentar: eu sou Alda, a primeira robô criada para ser assistente dos Conselhos Comunitários de Segurança Pública (CCS) do RJ e ' +
		'ajudar na construção de uma cidade mais segura. É ótimo contar com você para isso! 🙂',
		greetImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/32c149ee-6180-42f0-8fea-a4952686c188.jpg',
		firstMessage: 'Quer saber mais sobre mim?',
		menuOptions: ['Claro, fala mais', 'Agora não'],
		menuPostback: ['aboutMe', 'notMe'],
		comeBack: 'Que bom te ver novamente!',
		likeImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/a5e8ffa7-c0c6-412e-82ba-b9e127ca2f91.png',
	},
	aboutMe: {
		firstMessage: 'Oba 😀\n' +
		'Então, eu fui desenvolvida pelo Instituto de Segurança Pública (ISP), em parceria com o Instituto de Tecnologia e Sociedade do Rio (ITS Rio) ' +
		'e o Centro de Estudos de Segurança e Cidadania (Cesec). \nEu tô aqui para te ajudar a conhecer melhor o seu Conselho Comunitário de Segurança: ' +
		'data, local e pautas das reuniões, mostrar os problemas que estão sendo resolvidos e também fazer com que as suas sugestões sejam ouvidas.',
		secondMessage: 'Ah, importante falar que as suas respostas são totalmente seguras e serão vistas apenas pelo ISP, ITS Rio e Cesec para que a sua ' +
		'opinião seja ouvida. 😉 \nÉ um enorme prazer poder conversar com você!',
		thirdMessage: 'Quer saber o que são os Conselhos Comunitários de Segurança?',
		menuOptions: ['Claro, me conta!', 'Agora não'],
		menuPostback: ['whichCCS', 'notCCS'],
		notNow: 'Tudo bem, você quem manda. 😃',
	},
	whichCCS: {
		firstMessage: 'Os Conselhos Comunitários de Segurança são espaços onde as pessoas levam os problemas de segurança nos seus bairros e soluções para reduzir ' +
		'a violência e a criminalidade. São debates entre os moradores e as polícias civil e militar do RJ.',
		secondMessage: 'Veja os Conselhos que existem no estado:',
		CCSImage: 'https://scontent.fcgh9-1.fna.fbcdn.net/v/t1.15752-9/34072623_365710203936336_4290997827095494656_n.jpg?_nc_cat=0&_nc_eui2=AeEkeMFw8FUYVOWc8Wog_tQznUM83l4JSI-B1esmOAcRKYZ8lp2x5jCX5OdzZaV9zp0F4NV0ufGe-be6LdXGhFMv8VVWAQOzh2mveowAXlRcdA&oh=ded50dc788ad92a8d66a8df2ec510822&oe=5BA70F73',
		thirdMessage: 'Quer saber sobre o Conselho mais próximo de você?',
		menuOptions: ['Sim!', 'Quero Digitar', 'Agora não'],
		menuPostback: ['sendLocation', 'wantToType', 'noLocation'],
		notNow: 'Entendo! 😉',
		remember: 'Pelo que me lembro você quer saber sobre a região X e o conselho que eu encontrei aqui foi o AISP (Área Integrada de Segurança Pública) $nearest.',
		// the rest of the dialog comes from foundLocation
	},
	sendLocation: {
		firstMessage: 'Ótimo! 👍',
		secondMessage: 'Clique em "Enviar Localização" para enviar sua localização ⬇️',
	},
	wantToType: {
		firstMessage: 'Digite a região ou bairro da cidade do Rio de Janeiro que você gostaria de ver',
	},
	foundLocation: {
		firstMessage: 'Você quer saber sobre a região X e o conselho que eu encontrei aqui foi o AISP (Área Integrada de Segurança Pública) Y.',
		secondMessage: 'Podemos seguir ou você quer alterar o local?',
		menuOptions: ['Sim, avançar', 'Não, quero trocar'],
		menuPostback: ['nearestCouncil', 'wantToChange'],
	},
	confirmLocation: {
		firstMessage: 'Encontrei o seguinte endereço:',
		secondMessage: 'É esse o endereço certo?',
		menuOptions: ['É esse mesmo', 'Não é esse'],
		menuPostback: ['nearestCouncil', 'notAddress'],
		noFirst: 'Não consegui encontrar nenhum endereço com',
		noSecond: 'Deseja tentar novamente? Dessa vez com mais detalhes para me ajudar? Ou prefere me enviar sua localização?',
		noOptions: ['Enviar localização', 'Digitar de novo', 'Agora não'],
		noPostback: ['sendLocation', 'wantToType', 'noLocation'],
	},
	wantToChange: {
		firstMessage: 'Ih, errei. Me ajuda, então?',
		secondMessage: 'Digite a região ou bairro da cidade do Rio de Janeiro que você gostaria de ver:',
	},
	nearestCouncil: {
		firstMessage: 'Ótimo! 🎉',
		secondMessage: 'Então, o Conselho mais próximo de você é o da AISP $nearest, que engloba os bairros de x, y e z.',
		thirdMessage: 'Você já foi em alguma reunião do seu Conselho?',
		menuOptions: ['Sim', 'Não'],
		menuPostback: ['wentAlready', 'neverWent'],
		neverWent: 'Ainda tem tempo! A sua participação é muito importante para que os Conselhos tragam mais resultados.',
	},
	wentAlready: {
		firstMessage: 'Que ótimo! A sua participação é muito importante para que os Conselhos tragam cada vez mais resultados.',
		secondMessage: 'Antes de mostrar o que você pode fazer por aqui, quer saber quem são os membros da diretoria do seu Conselho?',
		menuOptions: ['Sim', 'Não'],
		menuPostback: ['wannaKnowMembers', 'notWannaKnow'],
	},
	wannaKnowMembers: {
		firstMessage: 'Legal! Vou te mostrar quem faz parte do Conselho X:',
		carousel: [
			{
				title: 'Nome Sobrenome',
				subtitle: 'Função',
				image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/5c87a0a3-febf-40fa-bcbc-bbefee27b9c1.png',
			},
			{
				title: 'Nome Sobrenome',
				subtitle: 'Função',
				image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/2d5bb59f-65d8-483d-b853-c4e5e07f762e.png',
			}],
		secondMessage: 'Bacana né, olha só o que mais você pode fazer por aqui!',
	},
	councilMenu: {
		firstMessage: 'Escolha uma das opções:',
		menuOptions: ['Calendário', 'Assuntos', 'Resultados'],
		menuPostback: ['calendar', 'subjects', 'results'],
		notNow: 'Beleza. 😉 \nEntão, vamos seguir em frente, olha só o que você pode fazer por aqui!',
	},
	calendar: {
		firstMessage: 'A data da próxima reunião do seu CCS é Y e vai acontecer no local Z.',
		secondMessage: 'Você pode ver o que será discutido na próxima reunião, clicando em "Assuntos" ou ver o que foi discutido na reunião anterior, ' +
		'clicando em "Resultados". 😉\nAlém disso, você também pode compartilhar que eu existo, se manter informado ou me seguir nas redes sociais clicando em "Fazer parte".',
		menuOptions: ['Assuntos', 'Resultados', 'Fazer parte'],
		menuPostback: ['subjects', 'results', 'join'],
	},
	subjects: {
		firstMessage: 'Para a próxima reunião as pautas são:',
		secondMessage: '1- Lorem ipsum 2 - Lorem ipsum se o texto for extenso, sugerimos a pessoa baixar um PDF, colocando um link externo',
		pdfName: 'Baixar PDF',
		pdfLink: 'http://www.africau.edu/images/default/sample.pdf',
		thirdMessage: 'Você pode ver quando e onde vai ocorrer a próxima reunião, clicando em "Calendário" ou ver o que foi discutido na reunião anterior, ' +
		' clicando em "Resultados". 😉\nAlém disso, você também pode compartilhar que eu existo, se manter informado ou me seguir nas redes sociais clicando em "Fazer parte".',
		menuOptions: ['Calendário', 'Resultados', 'Fazer parte'],
		menuPostback: ['calendar', 'results', 'join'],
	},
	results: {
		firstMessage: 'A última reunião ocorreu no dia xx/xx/xx. No link abaixo você pode visualizar o PDF completinho do que rolou:',
		pdfName: 'Baixar PDF',
		pdfLink: 'http://www.africau.edu/images/default/sample.pdf',
		secondMessage: 'Você pode ver quando e onde vai ocorrer a próxima reunião, clicando em "Calendário" ou ver o que será discutido na próxima reunião, ' +
		'clicando em "Assuntos". 😉\nAlém disso, você também pode compartilhar que eu existo, se manter informado ou me seguir nas redes sociais clicando em "Fazer parte".',
		menuOptions: ['Calendário', 'Assuntos', 'Fazer parte'],
		menuPostback: ['calendar', 'subjects', 'join'],
	},
	mainMenu: {
		firstMessage: 'Veja como eu posso te ajudar por aqui:',
		menuOptions: ['Meu conselho', 'Fazer parte', 'Sobre a Alda'],
		menuPostback: ['whichCCSMenu', 'join', 'aboutMe'],
		notNow: 'Tudo bem 😉',
	},
	join: {
		firstMessage: 'Legal saber que quer mostrar que eu existo para outras pessoas e ajudar na construção de uma vizinhança mais segura! Veja como você pode fazer parte!',
		menuOptions: ['Me manter informado', 'Sequir redes sociais', 'Compartilhar', 'Voltar para o Menu'],
		menuPostback: ['keepMe', 'followMedia', 'share', 'goBackMenu'],
	},
	keepMe: {
		firstMessage: 'Que legal! 😀\nComo você quer fazer isso: e-mail, WhatsApp ou aqui pelo Face mesmo?',
		menuOptions: ['E-mail', 'WhatsApp', 'Facebook', 'Voltar para o Menu'],
		menuPostback: ['eMail', 'whatsApp', 'facebook', 'goBackMenu'],
	},
	userData: {
		eMail: 'Legal! Escreva seu E-Mail abaixo para o conselho te manter informado. 😉',
		whatsApp: 'Legal! Escreva seu telefone com o DDD para o conselho te manter informado. 😉',
		phoneExample: 'Exemplo: 944445555',
		facebook: 'Combinado! 😉 Sempre que tiver novidades te avisarei por aqui!',
		menuMessage: 'Para o que você precisar, eu to sempre por aqui. Acesse o menu para conversar comigo ou escolha uma das opções: 😘',
		menuOptions: ['Fazer parte', 'Voltar para o Menu'],
		menuPostback: ['join', 'goBackMenu'],
	},
	share: {
		firstMessage: 'Muito bom 😍',
		shareButton: '[Botão share]',
		secondMessage: 'Para o que você precisar, eu to sempre por aqui. Acesse o menu para conversar comigo ou escolha uma das opções: 😘',
		menuOptions: ['Fazer parte', 'Voltar para o Menu'],
		menuPostback: ['join', 'goBackMenu'],
	},
	followMedia: {
		firstMessage: 'Curta a minha página! Sempre tem novidades por aqui!',
		linkTitle: 'Facebook',
		pageLink: 'http://www.consperj.rj.gov.br/',
		secondMessage: 'Para o que você precisar, eu to sempre por aqui. Acesse o menu para conversar comigo ou escolha uma das opções: 😘',
		menuOptions: ['Fazer parte', 'Voltar para o Menu'],
		menuPostback: ['join', 'goBackMenu'],
	},
	error: {
		noText: '\nEu sou a Alda e sou uma robô novinha, meus algoritmos não entendem as mensagens (linguagem natural). Além disso, ' +
		'eu estou nesse ambiente de teste, não funciono perfeitamente. Me perdoa, mas robôs também podem decepcionar como os humanos ¯\\_(ツ)_/¯' +
		'\n\nPosso te pedir um favor? Vamos começar a conversa novamente e você vai clicando nos botões. Pode ser?',
		menuOptions: ['Iniciar'],
		menuPostback: ['greetings'],

	},

};

