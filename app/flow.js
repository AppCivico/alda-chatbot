// This class stores text messages, urls and quick_replies

// const emoji = require('node-emoji');

module.exports = {
  greetings: {
    getStarted: 'Olá! Sou a Alda, vou te ajudar a acompanhar a segurança da sua região. Clique em começar para falar comigo',
    welcome: 'Deixa eu me apresentar: eu sou Alda, a primeira robô criada para ser assistente dos Conselhos Comunitários de Segurança Pública (CCS) do RJ e '
			+ 'ajudar na construção de uma cidade mais segura. É ótimo contar com você para isso! 🙂',
    greetImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/f9f014a2-56de-4bc8-a201-538b2b6300cd.png',
    // greetImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/e22edc9d-36a0-4ebc-85a8-4cb13303c8bb.png',
    firstMessage: 'Quer saber mais sobre mim?',
    menuOptions: ['Claro, fala mais', 'Agora não'],
    menuPostback: ['aboutMe', 'notMe'],
    comeBack: 'Que bom te ver novamente!',
    likeImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/a5e8ffa7-c0c6-412e-82ba-b9e127ca2f91.png',
  },
  aboutMe: {
    firstMessage: 'Oba. 😀\n'
			+ 'Então, eu fui desenvolvida pelo Instituto de Segurança Pública (ISP), em parceria com o Instituto de Tecnologia e Sociedade do Rio (ITS Rio) '
			+ 'e o Centro de Estudos de Segurança e Cidadania (Cesec). \nEu tô aqui para te ajudar a conhecer melhor o seu Conselho Comunitário de Segurança: '
			+ 'data, local e pautas das reuniões, mostrar os problemas que estão sendo resolvidos e também fazer com que as suas sugestões sejam ouvidas.',
    secondMessage: 'Ah, importante falar que as suas respostas são totalmente seguras e serão vistas apenas pelo ISP, ITS Rio e Cesec para que a sua '
			+ 'opinião seja ouvida. 😉 \nÉ um enorme prazer poder conversar com você!',
    thirdMessage: 'Quer saber o que são os Conselhos Comunitários de Segurança?',
    menuOptions: ['Claro, me conta!', 'Agora não'],
    menuPostback: ['whichCCS', 'notCCS'],
    notNow: 'Tudo bem, você quem manda. 😃',
  },
  whichCCS: {
    firstMessage: 'Os Conselhos Comunitários de Segurança são espaços onde as pessoas levam os problemas de segurança nos seus bairros e pensam soluções para reduzir '
	+ 'a violência e a criminalidade. São debates entre os moradores e as polícias civil e militar do RJ.',
    secondMessage: 'Veja os Conselhos que existem no estado:',
    CCSImage: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/0001bb88-a1b3-4c54-a3e3-f512e4262acb.png',
    thirdMessage: 'Quer saber sobre o Conselho mais próximo de você?',
    menuOptions: ['Enviar Localização', 'Digitar local', 'Agora não'],
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
    secondMessage: 'Ao clicar no botão, um mapa da sua localização atual aparecerá. Você poderá mover o cursor e dar zoom para ajustar a localização, caso necessário.',
    thirdMessage: 'Clique em "Enviar Localização" para enviar sua localização ⬇️',
    menuOptions: ['Voltar'],
    menuPostback: ['whichCCSMenu'],
  },
  wantToType: {
    firstMessage: 'Digite a *cidade* do Rio de Janeiro que você gostaria de ver.',
    secondMessage: 'Legal. Agora digite o *bairro* dessa cidade:',
    retryType: 'Tudo bem. Vamos encontrar o conselho mais adequado para sua região.',
    // menuOptions: ['Sim, avançar', 'Não, quero trocar'],
    // menuPostback: ['advance', 'wantToChange'],
  },
  wantToType2: {
    noSugestao: 'Legal. Agora digite o *bairro* da cidade Rio de Janeiro.',
    withSugestao: 'Legal. Agora digite o *bairro* da cidade Rio de Janeiro. Você pode tentar bairros como <sugestao> e outros.',
  },
  foundLocation: {
    firstMessage: 'Encontrei o seguinte município:',
    secondMessage: 'Podemos seguir ou você quer alterar o local?',
    menuOptions: ['Sim, avançar', 'Não, digitar outro'],
    menuPostback: ['preNearestCouncil', 'wantToChange'],
    noFindGeo: 'Desculpe, não consegui encontrar nenhum endereço. Parece que um erro aconteceu!',
    notFoundFromGeo: 'Não encontrei nenhum conselho no local em questão. Quer tentar novamente?',
    noSecond: 'Deseja tentar novamente? Você pode tentar me enviar sua localização de novo ou digitar a cidade em que você se encontra.',
  },
  checkBairro: {
    menuOptions: ['Sim, é esse mesmo', 'Não é esse'],
    menuPostback: ['checkBairroFromGeo', 'wantToChange'],
  },
  checkPaqueta: {
    menuOptions: ['Sim, exatamente', 'Não, é outro'],
    menuPostback: ['checkPaqueta', 'wantToChange'],
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
    secondMessage: 'Digite a *cidade* do Rio de Janeiro que você gostaria de ver.',
    helpMessage: 'Se estiver com dificuldade, envie sua localização diretamente:',
    menuOptions: ['Enviar localização', 'Cancelar'],
    menuPostback: ['sendLocation', 'noLocation'],
  },
  nearestCouncil: {
    firstMessage: 'Ótimo! 🎉',
    secondMessage: 'Então, o Conselho mais próximo de você é o', // will be completed
    secondMessage2: 'que engloba', // will be completed
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
    secondMessage: 'Além desses membros, moradores eleitos para essas funções, fazem parte da diretoria de cada Conselho os chamados membros natos: '
			+ 'o Comandante do Batalhão de Polícia Militar da área e o Delegado Titular da Delegacia de Polícia Civil mais próxima.',
    thirdMessage: 'Bacana, né? Olha só o que mais você pode fazer por aqui!',
    notActive: 'Não temos uma diretoria ativa atualmente para o <ccs>.\nVeja quem já foi membro:',
  },
  councilMenu: {
    firstMessage: 'Escolha uma das opções:',
    menuOptions: ['Calendário', 'Assuntos', 'Resultados', 'Voltar'],
    menuPostback: ['calendar', 'subjects', 'results', 'whichCCSMenu'],
    notNow: 'Beleza. 😉 \nEntão, vamos seguir em frente, olha só o que você pode fazer por aqui!',
  },
  calendar: {
    firstMessage: 'A data da próxima reunião do seu CCS é Y e vai acontecer no local Z.',
    preMenuMsg: 'Você pode ver o que será discutido na próxima reunião, clicando em "Assuntos" ou ver o que foi discutido na reunião anterior, '
			+ 'clicando em "Resultados". 😉\nAlém disso, você também pode compartilhar que eu existo, se manter informado ou me seguir nas redes sociais clicando em "Fazer parte".',
    preMenuMsgExtra: 'Você pode se manter informado ou me seguir nas redes sociais clicando em "Fazer parte". 😉',
    menuOptions: ['Assuntos', 'Resultados', 'Fazer parte'],
    menuPostback: ['subjects', 'results', 'join'],
  },
  subjects: {
    noReunion: 'Infelizmente, ainda não tem uma reunião agendada para o seu CCS. Não sabemos que assuntos serão discutidos na próxima reunião.',
    novidades: 'Fique por dentro das nossas novidades e ajude-nos a crescer clicando em "Fazer Parte".',
    firstMessage: 'Para a próxima reunião as pautas são:',
    title: 'Baixar Arquivo',
    sub: 'Baixe para ficar por dentro dos assuntos tratatos.',
    link: 'http://www.africau.edu/images/default/sample.pdf',
    preMenuMsg: 'Você pode ver quando e onde vai ocorrer a próxima reunião, clicando em "Calendário" ou ver o que foi discutido na reunião anterior, '
			+ ' clicando em "Resultados". 😉\nAlém disso, você também pode compartilhar que eu existo, se manter informado ou me seguir nas redes sociais clicando em "Fazer parte".',
    preMenuMsgExtra: 'Você pode se manter informado ou me seguir nas redes sociais clicando em "Fazer parte". 😉',
    emptyAssuntos: 'Esse CCS ainda não disponibilizou os assuntos discutidos na última reunião.',
    // menu --
    menuOptions: ['Calendário', 'Resultados', 'Fazer parte'],
    menuPostback: ['calendar', 'results', 'join'],
    imageLink: 'https://cdn2.iconfinder.com/data/icons/business-office-icons/256/To-do_List-512.png',
  },
  pautas: {
    txt1: 'Você quer sugerir algum assunto específico pra ser debatido na próxima reunião do seu Conselho? Eu posso encaminhar pra diretoria! 😁',
    noPauta1: 'Tudo bem, então!',
    askPauta1: 'Legal! Pode digitar pra mim o tema que você quer que seja debatido.',
    askPauta2: 'Obrigada pela sua sugestão! Vou encaminhar para a diretoria do seu Conselho! :)',
    menuOptions: ['Sim', 'Não'],
    menuPostback: ['askPauta', 'noPauta'],
  },
  results: {
    title: 'Baixar Arquivo',
    sub: 'Veja os resultados de nossos esforços.',
    imageLink: 'https://1.bp.blogspot.com/-ZazOVcAWe7k/WfcH1gYvEsI/AAAAAAAAHVU/wJl3MDU0ZpsGfTOfkggkc9tv1HMp_JrqwCLcBGAs/s1600/RESULTADOS.png',
    // link: 'http://www.africau.edu/images/default/sample.pdf',
    preMenuMsg: 'Você pode ver quando e onde vai ocorrer a próxima reunião, clicando em "Calendário" ou ver o que será discutido na próxima reunião, '
		+ 'clicando em "Assuntos". 😉\nAlém disso, você também pode compartilhar que eu existo, se manter informado ou me seguir nas redes sociais clicando em "Fazer parte".',
    preMenuMsgExtra: 'Você pode se manter informado ou me seguir nas redes sociais clicando em "Fazer parte". 😉',
    menuOptions: ['Calendário', 'Assuntos', 'Fazer parte'],
    menuPostback: ['calendar', 'subjects', 'join'],
    assuntos: 'Os assuntos que discutimos nessa última reunião foram: ',

  },
  denunciaStart: {
    txt1: 'Oi, <nome>, pelo que entendi você precisa fazer uma denúncia. Caso eu esteja certa, não posso te ajudar diretamente nesses casos, mas sei quem pode.',
    txt2: 'Eu preciso que você me explique qual tipo da denúncia você gostaria de fazer. Mas antes, vamos confirmar a localização que você deseja reportar (sua casa ou local do ocorrido).',
  },
  denunciaHasBairro: {
    txt1: 'Verifiquei que você está no bairro <bairro>. Podemos seguir ou deseja alterar? ',
    menuOptions: ['Confirmar', 'Digitar Novo Local', 'Enviar Localização', 'Não é denúncia'],
    menuPostback: ['denunciaMenu', 'denunciaType', 'denunciaLocation', 'denunciaNot'],
  },
  denunciaNoBairro: {
    txt1: 'Para te enviar os dados da Delegacia de Polícia mais próxima ou outro órgão e seguir com sua denúncia, eu preciso saber a localização de onde você sofreu a violência.',
    menuOptions: ['Digitar Novo Local', 'Enviar Localização', 'Não é denúncia'],
    menuPostback: ['denunciaType', 'denunciaLocation', 'denunciaNot'],
  },
  denunciaMenu: {
    txt1: 'Agora sim. Qual o tipo da denúncia? Passe para o lado para ver todas as opções.',
    denunciaNot: 'Desculpe, não entendi sua mensagem! Mas tudo bem, salvei aqui e logo mais meus criadores responderão sua dúvida.',
    menuOptions: ['Assalto', 'Agressão na rua', 'Agressão Doméstica', 'Violência Sexual', 'Perseguição', 'Violência Policial', 'Outro'],
    menuPostback: ['optDenun1', 'optDenun2', 'optDenun3', 'optDenun4', 'optDenun5', 'optDenun6', 'optDenun7'],
  },
  optDenun: {
    1: 'Poxa, sinto muito! 😕 Eu vou te passar o endereço da Delegacia de Polícia mais próxima pra você ir até lá prestar queixa e fazer o Boletim de Ocorrência, tudo bem? ',
    2: 'Poxa, sinto muito! 😕 Eu vou te passar o endereço da Delegacia de Polícia mais próxima pra você ir até lá prestar queixa e fazer o Boletim de Ocorrência, tudo bem? ',
    3: 'Sinto muito por você ter passado por isso. 😞 Eu vou te passar o endereço da Delegacia de Atendimento à Mulher mais próxima da sua casa. Não deixe de ir lá, tudo bem? É super importante para que isso não aconteça novamente. Qualquer coisa, fale comigo de novo!  ',
    4: {
      txt1: 'Sinto muito por você ter passado por isso. 😞 Não vou dizer que imagino o que você possa estar sentindo e passando neste momento, mas posso te ajudar nos primeiros passos. A primeira coisa é você ir em um hospital de emergência para vítimas de violência sexual, tudo bem? Vou te passar o endereço mais próximo.',
      txt2: 'Depois você precisa ir em uma Delegacia de Atendimento à Mulher e contar o que aconteceu. Fique tranquila que você vai poder falar com outra mulher lá. Aqui o endereço: ',
    },
    5: 'Eita, sinto muito que você esteja passando por isso. 😓 Eu vou te passar o endereço da Delegacia de Polícia mais próxima da sua casa pra você ir até lá prestar queixa e fazer o Boletim de Ocorrência, tudo bem? Se for algo mais específico, eles poderão te orientar melhor.',
    6: 'Sinto muito que você tenha passado por isso. 😞 Eu sei que essa é uma situação muito delicada e, por isso, em primeiro lugar eu quero te garantir que nada do que você está me contando será visto por autoridades policiais. Eu vou te passar o endereço e contato do Ministério Público, que é o melhor lugar onde você pode fazer essa denúncia e receber orientações, tudo bem?',
    7: 'Entendi, então vamos fazer o seguinte: vou te encaminhar o contato do Instituto de Segurança Pública e eles poderão te orientar melhor qual caminho seguir, tudo bem? ',
  },
  mainMenu: {
    firstMessage: 'Veja como eu posso te ajudar por aqui:',
    menuOptions: ['Meu conselho', 'Fazer parte', 'Sobre a Alda'],
    menuPostback: ['whichCCSMenu', 'join', 'aboutMe'],
    notNow: 'Tudo bem. 😉',
  },
  join: {
    firstMessage: 'É bom saber que você quer mostrar que eu existo para outras pessoas e ajudar na construção de uma vizinhança mais segura! Veja como você pode fazer parte!',
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
    facebook: 'Combinado! 😉 Sempre que tiver novidades te avisarei por aqui!',
    menuMessage: 'Para o que você precisar, eu to sempre por aqui. Acesse o menu para conversar comigo ou escolha uma das opções: 😘',
    menuOptions: ['Me manter informado', 'Seguir redes sociais', 'Compartilhar', 'Voltar para o Menu'],
    menuPostback: ['keepMe', 'followMedia', 'share', 'goBackMenu'],
  },
  share: {
    firstMessage: 'Muito bom! 😍',
    siteTitle: 'Alda, a robô dos CCS',
    siteSubTitle: 'Venha participar! 🤖',
    imageURL: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/f9f014a2-56de-4bc8-a201-538b2b6300cd.png',
    siteURL: 'https://www.facebook.com/aldaconselhos/',
    secondMessage: 'Para o que você precisar, eu to sempre por aqui. Acesse o menu para conversar comigo ou escolha uma das opções: 😘',
    menuOptions: ['Me manter informado', 'Seguir redes sociais', 'Voltar para o Menu'],
    menuPostback: ['keepMe', 'followMedia', 'goBackMenu'],
  },
  followMedia: {
    firstMessage: 'Curta a minha página! Sempre tem novidades por aqui!',
    title: 'Alda dos CCS no Facebook',
    sub: 'Junte-se a nós! 🤖',
    link: 'https://www.facebook.com/aldaconselhos/',
    secondMessage: 'Para o que você precisar, eu to sempre por aqui. Acesse o menu para conversar comigo ou escolha uma das opções: 😘',
    menuOptions: ['Me manter informado', 'Compartilhar', 'Voltar para o Menu'],
    menuPostback: ['keepMe', 'share', 'goBackMenu'],
    imageLink: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/f9f014a2-56de-4bc8-a201-538b2b6300cd.png',
  },
  error: {
    noText: '\nEu sou a Alda e sou uma robô novinha, meus algoritmos não entendem as mensagens (linguagem natural). '
	+ '\n\nPosso te pedir um favor? Vamos começar a conversa novamente e você vai clicando nos botões. Pode ser? '
	+ '\nSe você não tiver vendo nenhum botão abaixo dessa mensagem você deve estar usando o "Messenger Lite", por favor, tente conversar comigo com o app normal ou pelo computador',
    menuOptions: ['Ver meu Conselho', 'Trocar Conselho'],
    menuPostback: ['councilMenu', 'whichCCSMenu'],
  },
  phone: {
    firstMessage: 'Esse número não é válido! Quer tentar novamente?',
    whatsApp: 'Legal! Escreva seu telefone com o DDD para o conselho te manter informado. 😉',
    phoneExample: 'Exemplo: 2299999-8888',
    gotPhone: 'Guardamos seu telefone! Como posso te ajudar?',
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
  calendarOpt: {
    content_type: 'text',
    title: 'Calendário',
    payload: 'calendar',
  },
  subjectsOpt: {
    content_type: 'text',
    title: 'Assuntos',
    payload: 'subjects',
  },
  resultsOpt: {
    content_type: 'text',
    title: 'Resultados',
    payload: 'results',
  },
  joinOpt: {
    content_type: 'text',
    title: 'Fazer Parte',
    payload: 'join',
  },
  goBackMenu: {
    content_type: 'text',
    title: 'Voltar para o menu',
    payload: 'goBackMenu',
  },
  sequencia: {
    1: {
      question: 'Oi, <nome>! Perguntinha rápida, você conseguiu ir na reunião do seu Conselho que aconteceu ontem?',
      menuOptions: ['Sim', 'Não deu'],
      menuPostback: ['seq2', 'seq5'],
    },
    2: {
      question: 'Eba, que bom! 😍\nE me conta, a reunião foi boa?',
      menuOptions: ['Foi legal!', 'Não gostei muito'],
      menuPostback: ['seq3', 'seq4'],
    },
    3: {
      question: 'Amei! Obrigada por compartilhar comigo',
      menuOptions: ['Voltar para o menu'],
      menuPostback: ['goBackMenu'],
    },
    4: {
      question: 'Vish, entendo, Pra gente conseguir melhorar as reuniões cada vez mais, preciso que você me conte: o que mais te desagradou nela?',
      followUp: 'Tá bem! Eu vou conversar sobre essas críticas com os diretores dos Conselhos e vamos trabalhar para modificar essa situação. Obrigado pela ajuda! 💪',
      menuOptions: [],
      menuPostback: [],
    },
    5: {
      question: 'Ah, que pena. 😕\nMas você costuma ir nas reuniões ou nunca tem conseguido?',
      menuOptions: ['Eu vou sim!', 'Eu nunca vou'],
      menuPostback: ['seq6', 'seq7'],
    },
    6: {
      question: 'Ah, então tudo bem! Te aviso da próxima! 😍',
      menuOptions: ['Voltar para o menu'],
      menuPostback: ['goBackMenu'],
    },
    7: {
      question: 'Poxa, que pena. Por que isso acontece? Tem alguma razão?',
      followUp: 'Entendi! Obrigada por compartilhar comigo! Vou ler tudo com calma e, se for algo que eu possa mudar pra te ajudar, eu vou fazer. 💪',
      menuOptions: [],
      menuPostback: [],
    },
  },

};
