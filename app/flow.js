// This class stores text messages, urls and quick_replies

// const emoji = require('node-emoji');

module.exports = {
	greetings: {
		getStarted: 'Olá! Sou a Alda, vou te ajudar a acompanhar a segurança da sua região. Clique em começar para falar comigo',
		welcome: 'Deixa eu me apresentar: eu sou Alda, a primeira robô criada para ser assistente dos Conselhos Comunitários de Segurança Pública (CCS) do RJ e ' +
			'ajudar na construção de uma cidade mais segura. É ótimo contar com você para isso! 🙂',
		greetImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/f9f014a2-56de-4bc8-a201-538b2b6300cd.png',
		// greetImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/e22edc9d-36a0-4ebc-85a8-4cb13303c8bb.png',
		firstMessage: 'Quer saber mais sobre mim?',
		menuOptions: ['Claro, fala mais', 'Agora não'],
		menuPostback: ['aboutMe', 'notMe'],
		comeBack: 'Que bom te ver novamente!',
		likeImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/a5e8ffa7-c0c6-412e-82ba-b9e127ca2f91.png',
	},
	aboutMe: {
		firstMessage: 'Oba. 😀\n' +
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
		CCSImage: 'https://scontent.fcgh9-1.fna.fbcdn.net/v/t1.15752-9/38194146_527032771061721_6108443346118639616_n.jpg?_nc_cat=108&oh=2088b0ddfa5ad8c064aeca951f507c44&oe=5C5AC3E6',
		thirdMessage: 'Quer saber sobre o Conselho mais próximo de você?',
		menuOptions: ['Enviar Localização', 'Quero Digitar', 'Agora não'],
		menuPostback: ['sendLocation', 'wantToType1', 'noLocation'],
		notNow: 'Entendo! 😉',
		remember: 'Pelo que me lembro você quer saber sobre o', // will be completed
		remember2: 'e o conselho que eu encontrei aqui foi o', // will be completed
		// the rest of the dialog comes from foundLocation
	},
	whichCCSMenu: {
		menuOptions: ['Sim, avançar', 'Digitar novo local', 'Enviar Localização'],
		menuPostback: ['advance', 'retryType', 'sendLocation'],
	},
	geoMenu: {
		menuOptions: ['Quero Digitar', 'Agora não'],
		menuPostback: ['wantToType1', 'noLocation'],
	},
	sendLocation: {
		firstMessage: 'Ótimo! 👍',
		secondMessage: 'Clique em "Enviar Localização" para enviar sua localização ⬇️',
	},
	wantToType: {
		firstMessage: 'Digite a cidade do Rio de Janeiro que você gostaria de ver.',
		secondMessage: 'Legal. Agora digite o bairro dessa cidade:',
		// menuOptions: ['Sim, avançar', 'Não, quero trocar'],
		// menuPostback: ['advance', 'wantToChange'],

	},
	foundLocation: {
		firstMessage: 'Encontrei o seguinte município:',
		secondMessage: 'Podemos seguir ou você quer alterar o local?',
		menuOptions: ['Sim, avançar', 'Não, digitar outro'],
		menuPostback: ['preNearestCouncil', 'wantToChange'],
		noFindGeo: 'Desculpe, não consegui encontrar nenhum endereço. Parece que um erro aconteceu!',
		noSecond: 'Deseja tentar novamente? Você pode tentar me enviar sua localização de novo ou digitar a cidade em que você se encontra.',
	},
	checkBairro: {
		menuOptions: ['Sim, é esse mesmo', 'Não é esse'],
		menuPostback: ['checkBairroFromGeo', 'wantToChange'],
	},
	notFound: {
		menuOptions: ['Enviar localização', 'Digitar de novo', 'Agora não'],
		menuPostback: ['sendLocation', 'wantToType1', 'noLocation'],
	},
	notFoundMunicipio: {
		menuOptions: ['Enviar localização', 'Digitar de novo', 'Agora não'],
		menuPostback: ['sendLocation', 'wantToType1', 'noLocation'],
	},
	notFoundBairro: {
		menuOptions: ['Enviar localização', 'Trocar Cidade', 'Voltar'],
		menuPostback: ['sendLocation', 'wantToType1', 'noLocation'],
	},
	notFoundBairroFromGeo: {
		menuOptions: ['Enviar localização', 'Trocar Conselho', 'Voltar'],
		menuPostback: ['sendLocation', 'wantToType1', 'noLocation'],
	},
	wantToChange: {
		firstMessage: 'Ih, errei. Me ajuda, então?',
		secondMessage: 'Digite a cidade do Rio de Janeiro que você gostaria de ver.',
		helpMessage: 'Se estiver com dificuldade, envie sua localização diretamente:',
		menuOptions: ['Enviar localização', 'Cancelar'],
		menuPostback: ['sendLocation', 'noLocation'],
	},
	nearestCouncil: {
		firstMessage: 'Ótimo! 🎉',
		secondMessage: 'Então, o Conselho mais próximo de você é o', // will be completed
		secondMessage2: 'que também engloba', // will be completed
		secondMessage3: 'que engloba a região', // will be completed
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
		firstMessage: 'Legal! Vou te mostrar quem faz parte do Conselho',
		secondMessage: 'Bacana, né? Olha só o que mais você pode fazer por aqui!',
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
		title: 'Baixar Arquivo',
		sub: 'Baixe para ficar por dentro dos assuntos tratatos.',
		link: 'http://www.africau.edu/images/default/sample.pdf',
		thirdMessage: 'Você pode ver quando e onde vai ocorrer a próxima reunião, clicando em "Calendário" ou ver o que foi discutido na reunião anterior, ' +
			' clicando em "Resultados". 😉\nAlém disso, você também pode compartilhar que eu existo, se manter informado ou me seguir nas redes sociais clicando em "Fazer parte".',
		emptyAssuntos: 'Esse CCS ainda não produz ata no modelo/formato “Ata Eletrônica”',
		// menu --
		menuOptions: ['Calendário', 'Resultados', 'Fazer parte'],
		menuPostback: ['calendar', 'results', 'join'],
		imageLink: 'https://cdn2.iconfinder.com/data/icons/business-office-icons/256/To-do_List-512.png',
	},
	results: {
		title: 'Baixar Arquivo',
		sub: 'Veja os resultados de nossos esforços.',
		imageLink: 'https://1.bp.blogspot.com/-ZazOVcAWe7k/WfcH1gYvEsI/AAAAAAAAHVU/wJl3MDU0ZpsGfTOfkggkc9tv1HMp_JrqwCLcBGAs/s1600/RESULTADOS.png',
		// link: 'http://www.africau.edu/images/default/sample.pdf',
		secondMessage: 'Você pode ver quando e onde vai ocorrer a próxima reunião, clicando em "Calendário" ou ver o que será discutido na próxima reunião, ' +
			'clicando em "Assuntos". 😉\nAlém disso, você também pode compartilhar que eu existo, se manter informado ou me seguir nas redes sociais clicando em "Fazer parte".',
		menuOptions: ['Calendário', 'Assuntos', 'Fazer parte'],
		menuPostback: ['calendar', 'subjects', 'join'],

	},
	mainMenu: {
		firstMessage: 'Veja como eu posso te ajudar por aqui:',
		menuOptions: ['Meu conselho', 'Fazer parte', 'Sobre a Alda'],
		menuPostback: ['whichCCSMenu', 'join', 'aboutMe'],
		notNow: 'Tudo bem. 😉',
	},
	join: {
		firstMessage: 'Legal saber que quer mostrar que eu existo para outras pessoas e ajudar na construção de uma vizinhança mais segura! Veja como você pode fazer parte!',
		menuOptions: ['Me manter informado', 'Seguir redes sociais', 'Compartilhar', 'Voltar para o Menu'],
		menuPostback: ['keepMe', 'followMedia', 'share', 'goBackMenu'],
	},
	keepMe: {
		firstMessage: 'Que legal! 😀\nComo você quer fazer isso: E-mail, WhatsApp ou aqui pelo Face mesmo?',
		menuOptions: ['E-mail', 'WhatsApp', 'Facebook', 'Voltar'],
		menuPostback: ['eMail', 'whatsApp', 'facebook', 'join'],
	},
	userData: {
		eMail: 'Legal! Escreva seu e-mail abaixo para o conselho te manter informado. 😉',
		emailExample: 'Exemplo: alda@chatbot.com',
		whatsApp: 'Legal! Escreva seu telefone com o DDD para o conselho te manter informado. 😉',
		phoneExample: 'Exemplo: 2299999-8888',
		facebook: 'Combinado! 😉 Sempre que tiver novidades te avisarei por aqui!',
		menuMessage: 'Para o que você precisar, eu to sempre por aqui. Acesse o menu para conversar comigo ou escolha uma das opções: 😘',
		menuOptions: ['Me manter informado', 'Seguir redes sociais', 'Compartilhar', 'Voltar para o Menu'],
		menuPostback: ['keepMe', 'followMedia', 'share', 'goBackMenu'],
	},
	share: {
		firstMessage: 'Muito bom! 😍',
		siteTitle: 'Alda, a robô do ITS',
		siteSubTitle: 'Venha participar! 🤖',
		imageURL: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/f9f014a2-56de-4bc8-a201-538b2b6300cd.png',
		siteURL: 'https://www.facebook.com/aldaChatbot/',
		secondMessage: 'Para o que você precisar, eu to sempre por aqui. Acesse o menu para conversar comigo ou escolha uma das opções: 😘',
		menuOptions: ['Me manter informado', 'Seguir redes sociais', 'Voltar para o Menu'],
		menuPostback: ['keepMe', 'followMedia', 'goBackMenu'],
	},
	followMedia: {
		firstMessage: 'Curta a minha página! Sempre tem novidades por aqui!',
		title: 'Alda do ITS no Facebook',
		sub: 'Junte-se a nós! 🤖',
		link: 'https://www.facebook.com/aldaChatbot/',
		secondMessage: 'Para o que você precisar, eu to sempre por aqui. Acesse o menu para conversar comigo ou escolha uma das opções: 😘',
		menuOptions: ['Me manter informado', 'Compartilhar', 'Voltar para o Menu'],
		menuPostback: ['keepMe', 'share', 'goBackMenu'],
		imageLink: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/f9f014a2-56de-4bc8-a201-538b2b6300cd.png',
	},
	error: {
		noText: '\nEu sou a Alda e sou uma robô novinha, meus algoritmos não entendem as mensagens (linguagem natural). ' +
			'\n\nPosso te pedir um favor? Vamos começar a conversa novamente e você vai clicando nos botões. Pode ser?',
		menuOptions: ['Recomeçar conversa', 'Ver meu Conselho', 'Trocar Conselho'],
		menuPostback: ['greetings', 'councilMenu', 'whichCCSMenu'],
	},
	phone: {
		firstMessage: 'Esse número não é válido! Quer tentar novamente?',
		menuOptions: ['Tentar Novamente', 'Voltar'],
		menuPostback: ['whatsApp', 'join'],
	},
	eMail: {
		firstMessage: 'Esse e-mail não é válido! Quer tentar novamente?',
		menuOptions: ['Tentar Novamente', 'Voltar'],
		menuPostback: ['eMail', 'join'],
	},

	adminStart: {
		menuOptions: ['Broadcast', 'Avisar Agenda', 'Métricas', 'Sair do Admin'],
		menuPostback: ['broadcast', 'warnCalendar', 'metrics', 'goBackMenu'],
	},
	warnCalendar: {
		menuOptions: ['Voltar', 'Sair do Admin'],
		menuPostback: ['adminStart', 'goBackMenu'],
	},
	metrics: {
		menuOptions: ['Avisar Agenda', 'Voltar', 'Sair do Admin'],
		menuPostback: ['warnCalendar', 'adminStart', 'goBackMenu'],
	},
	agendaConfirm1: {
		menuOptions: ['Sim', 'Não', 'Voltar'],
		menuPostback: ['agendaMessage', 'warnCalendar', 'adminStart'],
	},
	agendaConfirm2: {
		menuOptions: ['Trocar CCS', 'Voltar', 'Sair do Admin'],
		menuPostback: ['warnCalendar', 'adminStart', 'goBackMenu'],
	},
	agendaConfirmText: {
		menuOptions: ['Pode', 'Reescrever', 'Voltar'],
		menuPostback: ['broadcastSent', 'agendaMessage', 'adminStart'],
	},
	broadcastSent: {
		menuOptions: ['Ok', 'Métricas', 'Sair do Admin'],
		menuPostback: ['adminStart', 'metrics', 'goBackMenu'],
	},
	notificationDisable: {
		menuOptions: ['Entendi'],
		menuPostback: ['goBackMenu'],
	},
	confirmCCS: {
		menuOptions: ['Sim', 'Não', 'Voltar'],
		menuPostback: ['writeMessage', 'broadcast', 'adminStart'],
	},
	broadcastMenu: [
		{
			content_type: 'text',
			title: 'Meu Conselho',
			payload: 'whichCCSMenu',
		},
		{
			content_type: 'text',
			title: 'Parar Notificações',
			payload: 'disableNotifications',
		},
	],
};


const aaa = [{
	address_components: [{ long_name: '676', short_name: '676', types: ['street_number'] }, { long_name: 'Avenida Fagundes Filho', short_name: 'Av. Fagundes Filho', types: ['route'] }, { long_name: 'Vila Monte Alegre', short_name: 'Vila Monte Alegre', types: ['political', 'sublocality', 'sublocality_level_1'] }, { long_name: 'São Paulo', short_name: 'São Paulo', types: ['administrative_area_level_2', 'political'] }, { long_name: 'São Paulo', short_name: 'SP', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Brasil', short_name: 'BR', types: ['country', 'political'] }, { long_name: '04304-000', short_name: '04304-000', types: ['postal_code'] }],
	formatted_address: 'Av. Fagundes Filho, 676 - Vila Monte Alegre, São Paulo - SP, 04304-000, Brasil',
	geometry: {
		bounds: { northeast: { lat: -23.6270203, lng: -46.6349727 }, southwest: { lat: -23.6271313, lng: -46.6350649 } }, location: { lat: -23.6270793, lng: -46.63500810000001 }, location_type: 'ROOFTOP', viewport: { northeast: { lat: -23.6257268197085, lng: -46.6336698197085 }, southwest: { lat: -23.6284247802915, lng: -46.6363677802915 } },
	},
	place_id: 'ChIJl_vH4v5azpQRSAhhYOjWMBk',
	types: ['premise'],
}, {
	address_components: [{ long_name: '676', short_name: '676', types: ['street_number'] }, { long_name: 'Avenida Fagundes Filho', short_name: 'Av. Fagundes Filho', types: ['route'] }, { long_name: 'São Judas', short_name: 'São Judas', types: ['political', 'sublocality', 'sublocality_level_1'] }, { long_name: 'São Paulo', short_name: 'São Paulo', types: ['administrative_area_level_2', 'political'] }, { long_name: 'São Paulo', short_name: 'SP', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Brasil', short_name: 'BR', types: ['country', 'political'] }, { long_name: '04304-010', short_name: '04304-010', types: ['postal_code'] }], formatted_address: 'Av. Fagundes Filho, 676 - São Judas, São Paulo - SP, 04304-010, Brasil', geometry: { location: { lat: -23.6270758, lng: -46.6350188 }, location_type: 'ROOFTOP', viewport: { northeast: { lat: -23.6257268197085, lng: -46.63366981970849 }, southwest: { lat: -23.6284247802915, lng: -46.63636778029149 } } }, place_id: 'ChIJ84dqHf9azpQRF0dDwh_JGvs', plus_code: { compound_code: '99F7+5X São Paulo, SP, Brasil', global_code: '588M99F7+5X' }, types: ['establishment', 'point_of_interest'],
}, {
	address_components: [{ long_name: '640', short_name: '640', types: ['street_number'] }, { long_name: 'Avenida Fagundes Filho', short_name: 'Av. Fagundes Filho', types: ['route'] }, { long_name: 'Vila Monte Alegre', short_name: 'Vila Monte Alegre', types: ['political', 'sublocality', 'sublocality_level_1'] }, { long_name: 'São Paulo', short_name: 'São Paulo', types: ['administrative_area_level_2', 'political'] }, { long_name: 'São Paulo', short_name: 'SP', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Brasil', short_name: 'BR', types: ['country', 'political'] }, { long_name: '04304-000', short_name: '04304-000', types: ['postal_code'] }], formatted_address: 'Av. Fagundes Filho, 640 - Vila Monte Alegre, São Paulo - SP, 04304-000, Brasil', geometry: { location: { lat: -23.6269949, lng: -46.6351798 }, location_type: 'ROOFTOP', viewport: { northeast: { lat: -23.6256459197085, lng: -46.6338308197085 }, southwest: { lat: -23.6283438802915, lng: -46.6365287802915 } } }, place_id: 'ChIJGQXqHf9azpQRCSx7lIVV-N4', plus_code: { compound_code: '99F7+6W São Paulo, SP, Brasil', global_code: '588M99F7+6W' }, types: ['street_address'],
}, {
	address_components: [{ long_name: '667', short_name: '667', types: ['street_number'] }, { long_name: 'Avenida Fagundes Filho', short_name: 'Av. Fagundes Filho', types: ['route'] }, { long_name: 'Vila Monte Alegre', short_name: 'Vila Monte Alegre', types: ['political', 'sublocality', 'sublocality_level_1'] }, { long_name: 'São Paulo', short_name: 'São Paulo', types: ['administrative_area_level_2', 'political'] }, { long_name: 'São Paulo', short_name: 'SP', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Brasil', short_name: 'BR', types: ['country', 'political'] }, { long_name: '04304-010', short_name: '04304-010', types: ['postal_code'] }], formatted_address: 'Av. Fagundes Filho, 667 - Vila Monte Alegre, São Paulo - SP, 04304-010, Brasil', geometry: { location: { lat: -23.6268652, lng: -46.6350303 }, location_type: 'RANGE_INTERPOLATED', viewport: { northeast: { lat: -23.62551621970849, lng: -46.6336813197085 }, southwest: { lat: -23.6282141802915, lng: -46.6363792802915 } } }, place_id: 'Ek9Bdi4gRmFndW5kZXMgRmlsaG8sIDY2NyAtIFZpbGEgTW9udGUgQWxlZ3JlLCBTw6NvIFBhdWxvIC0gU1AsIDA0MzA0LTAxMCwgQnJhc2lsIhsSGQoUChIJjcHpIf9azpQRsjFlC7gOvAsQmwU', types: ['street_address'],
}, {
	address_components: [{ long_name: 'Vila Monte Alegre', short_name: 'Vila Monte Alegre', types: ['political', 'sublocality', 'sublocality_level_1'] }, { long_name: 'São Paulo', short_name: 'São Paulo', types: ['administrative_area_level_2', 'political'] }, { long_name: 'São Paulo', short_name: 'SP', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Brasil', short_name: 'BR', types: ['country', 'political'] }],
	formatted_address: 'Vila Monte Alegre, São Paulo - SP, Brasil',
	geometry: {
		bounds: { northeast: { lat: -23.6212766, lng: -46.6288025 }, southwest: { lat: -23.6357702, lng: -46.6468303 } }, location: { lat: -23.6283836, lng: -46.6355399 }, location_type: 'APPROXIMATE', viewport: { northeast: { lat: -23.6212766, lng: -46.6288025 }, southwest: { lat: -23.6357702, lng: -46.6468303 } },
	},
	place_id: 'ChIJ-UjZIvlazpQR8oCeXSgIHh4',
	types: ['political', 'sublocality', 'sublocality_level_1'],
}, {
	address_components: [{ long_name: '04303', short_name: '04303', types: ['postal_code', 'postal_code_prefix'] }, { long_name: 'São Paulo', short_name: 'São Paulo', types: ['administrative_area_level_2', 'political'] }, { long_name: 'São Paulo', short_name: 'SP', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Brasil', short_name: 'BR', types: ['country', 'political'] }],
	formatted_address: 'São Paulo - SP, Brasil',
	geometry: {
		bounds: { northeast: { lat: -23.6216101, lng: -46.631556 }, southwest: { lat: -23.628675, lng: -46.6374824 } }, location: { lat: -23.625196, lng: -46.6349367 }, location_type: 'APPROXIMATE', viewport: { northeast: { lat: -23.6216101, lng: -46.631556 }, southwest: { lat: -23.628675, lng: -46.6374824 } },
	},
	place_id: 'ChIJq-UNd_9azpQR3m3ATOTP1JM',
	types: ['postal_code', 'postal_code_prefix'],
}, {
	address_components: [{ long_name: '04304-050', short_name: '04304-050', types: ['postal_code'] }, { long_name: 'Vila Monte Alegre', short_name: 'Vila Monte Alegre', types: ['political', 'sublocality', 'sublocality_level_1'] }, { long_name: 'São Paulo', short_name: 'São Paulo', types: ['administrative_area_level_2', 'political'] }, { long_name: 'São Paulo', short_name: 'SP', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Brasil', short_name: 'BR', types: ['country', 'political'] }],
	formatted_address: 'Vila Monte Alegre, São Paulo - SP, 04304-050, Brasil',
	geometry: {
		bounds: { northeast: { lat: -23.6243912, lng: -46.6331275 }, southwest: { lat: -23.629575, lng: -46.63554 } }, location: { lat: -23.6267859, lng: -46.6345937 }, location_type: 'APPROXIMATE', viewport: { northeast: { lat: -23.6243912, lng: -46.6329847697085 }, southwest: { lat: -23.629575, lng: -46.6356827302915 } },
	},
	place_id: 'ChIJP_Hscv9azpQRp2lSiJUUFp4',
	types: ['postal_code'],
}, {
	address_components: [{ long_name: 'São Paulo', short_name: 'São Paulo', types: ['administrative_area_level_2', 'political'] }, { long_name: 'São Paulo', short_name: 'SP', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Brasil', short_name: 'BR', types: ['country', 'political'] }],
	formatted_address: 'São Paulo - SP, Brasil',
	geometry: {
		bounds: { northeast: { lat: -23.356293, lng: -46.3650838 }, southwest: { lat: -24.0084309, lng: -46.826199 } }, location: { lat: -23.6503225, lng: -46.70917670000001 }, location_type: 'APPROXIMATE', viewport: { northeast: { lat: -23.356293, lng: -46.3650838 }, southwest: { lat: -24.0084309, lng: -46.826199 } },
	},
	place_id: 'ChIJ9cXwmIFEzpQR7-ebZCySXMo',
	types: ['administrative_area_level_2', 'political'],
}, {
	address_components: [{ long_name: 'São Paulo', short_name: 'São Paulo', types: ['locality', 'political'] }, { long_name: 'São Paulo', short_name: 'São Paulo', types: ['administrative_area_level_2', 'political'] }, { long_name: 'São Paulo', short_name: 'SP', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Brasil', short_name: 'BR', types: ['country', 'political'] }],
	formatted_address: 'São Paulo, SP, Brasil',
	geometry: {
		bounds: { northeast: { lat: -23.3566039, lng: -46.3650844 }, southwest: { lat: -24.0082209, lng: -46.825514 } }, location: { lat: -23.5505199, lng: -46.63330939999999 }, location_type: 'APPROXIMATE', viewport: { northeast: { lat: -23.3566039, lng: -46.3650844 }, southwest: { lat: -24.0082209, lng: -46.825514 } },
	},
	place_id: 'ChIJ0WGkg4FEzpQRrlsz_whLqZs',
	types: ['locality', 'political'],
}, {
	address_components: [{ long_name: 'São Paulo', short_name: 'SP', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Brasil', short_name: 'BR', types: ['country', 'political'] }],
	formatted_address: 'São Paulo, Brasil',
	geometry: {
		bounds: { northeast: { lat: -19.7796583, lng: -44.1613651 }, southwest: { lat: -25.3126231, lng: -53.1101046 } }, location: { lat: -23.5431786, lng: -46.6291845 }, location_type: 'APPROXIMATE', viewport: { northeast: { lat: -19.7796583, lng: -44.1613651 }, southwest: { lat: -25.3126231, lng: -53.1101046 } },
	},
	place_id: 'ChIJrVgvRn1ZzpQRF3x74eJBUh4',
	types: ['administrative_area_level_1', 'political'],
}, {
	address_components: [{ long_name: 'Brasil', short_name: 'BR', types: ['country', 'political'] }],
	formatted_address: 'Brasil',
	geometry: {
		bounds: { northeast: { lat: 5.2717863, lng: -28.650543 }, southwest: { lat: -34.0891, lng: -73.9828169 } }, location: { lat: -14.235004, lng: -51.92528 }, location_type: 'APPROXIMATE', viewport: { northeast: { lat: 5.2717863, lng: -28.650543 }, southwest: { lat: -34.0891, lng: -73.9828169 } },
	},
	place_id: 'ChIJzyjM68dZnAARYz4p8gYVWik',
	types: ['country', 'political'],
}];


if (aaa) {
	console.log('ss');
}
