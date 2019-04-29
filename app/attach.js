// Module for sending attachments to bot
// context is the context from bot.onEvent
// links is the object from flow.js from the respective dialog

const { capitalizeWords } = require('./helpers');
const { checkMenu } = require('./helpers');

module.exports.sendCarouselMembrosNatos = async (context, items) => {
	const elements = [];
	let firstCMD;

	// regular case: each bairro has only 1 set of membros natos associated with it
	// special case: some bairros have more than one set of membros natos associated with it.
	// Meaning, the same cmd_bpm for different delegados. The special case bairros are listed below:
	// 3 Centro, 2 Tanque, 2 Tijuca, 2 Água Santa, 2 Oswaldo Cruz, 2 Engenho de Dentro, 2 Brás de Pina, 2 Penha Circular, 2 Todos os Santos, 2 Colégio, 2 Copacabana

	items.forEach(async (element) => {
		if (!firstCMD || firstCMD !== element.cmd_bpm) { // check if colonel is different
			elements.push({
				title: capitalizeWords(element.cmd_bpm),
				subtitle: 'Comandante do Batalhão de Polícia Militar',
			});
			firstCMD = element.cmd_bpm;
		}
		elements.push({
			title: element.delegado,
			subtitle: 'Delegado Titular da Delegacia de Polícia Civil',
		});
	});
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements,
		},
	});
};

module.exports.sendCarouselDiretoria = async (context, items) => {
	const elements = [];

	items.forEach((element) => {
		elements.push({
			title: element.nome,
			subtitle: element.cargo,
			// image_url: 'https://gallery.mailchimp.com/926cb477483bcd8122304bc56/images/5c87a0a3-febf-40fa-bcbc-bbefee27b9c1.png',
		});
	});
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements,
		},
	});
};

// sends one card with an image and link
module.exports.sendCardWithLink = async function sendCardWithLink(context, cardData, url, text) {
	if (!text || text === '') { text = 'Veja o resultado dos nossos esforços!'; } // eslint-disable-line no-param-reassign
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements: [
				{
					title: cardData.title,
					subtitle: (text && text !== '') ? text : cardData.sub,
					image_url: cardData.imageLink,
					default_action: {
						type: 'web_url',
						url,
						messenger_extensions: 'false',
						webview_height_ratio: 'full',
					},
				},
			],
		},
	});
};

module.exports.sendCardWithout = async function sendCardWithLink(context, cardData) {
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements: [
				{
					title: cardData.title,
					subtitle: cardData.sub,
					image_url: cardData.imageLink,
					// default_action: {
					// 	type: 'web_url',
					// 	url,
					// 	messenger_extensions: 'false',
					// 	webview_height_ratio: 'full',
					// },
				},
			],
		},
	});
};


// get quick_replies opject with elements array
// supossed to be used with menuOptions and menuPostback for each dialog on flow.js
async function getQR(opt) {
	const elements = [];
	const firstArray = opt.menuOptions;

	firstArray.forEach((element, index) => {
		elements.push({
			content_type: 'text',
			title: element,
			payload: opt.menuPostback[index],
		});
	});

	return { quick_replies: elements };
}
module.exports.getQR = getQR;

module.exports.getQRLocation = async (opt) => {
	const elements = [];
	const firstArray = opt.menuOptions;

	elements.push({ content_type: 'location' });

	firstArray.forEach((element, index) => {
		elements.push({
			content_type: 'text',
			title: element,
			payload: opt.menuPostback[index],
		});
	});

	return { quick_replies: elements };
};

module.exports.getQRLocation2 = async (opt) => {
	const elements = [];
	const firstArray = opt.menuOptions;

	firstArray.forEach((element, index) => {
		elements.push({
			content_type: 'text',
			title: element,
			payload: opt.menuPostback[index],
		});
	});

	elements.push({ content_type: 'location' });

	return { quick_replies: elements };
};

async function getVoltarQR(lastDialog) {
	let lastPostback = '';

	if (lastDialog === 'optDenun') {
		lastPostback = 'goBackMenu';
	} else {
		lastPostback = lastDialog;
	}

	return {
		content_type: 'text',
		title: 'Voltar',
		payload: lastPostback,
	};
}

module.exports.getVoltarQR = getVoltarQR;
module.exports.getErrorQR = async (opt, lastDialog) => {
	const elements = [];
	const firstArray = opt.menuOptions;

	firstArray.forEach((element, index) => {
		elements.push({
			content_type: 'text',
			title: element,
			payload: opt.menuPostback[index],
		});
	});

	elements.push(await getVoltarQR(lastDialog));

	console.log('ERRORQR', elements);

	return { quick_replies: elements };
};

module.exports.getCouncilMenuQR = async (CCS, flow) => {
	let result = '';
	if (!CCS) {
		result = await getQR(flow.whichCCS);
		result = result.quick_replies;
	} else {
		result = await checkMenu(CCS.id, [flow.calendarOpt, flow.subjectsOpt, flow.resultsOpt, flow.joinOpt]);
	}
	console.log(result);

	return result;
};

module.exports.getConditionalQR = async (options, useSecond) => {
	const elements = [];
	let arrayToUse;
	if (useSecond === true) {
		arrayToUse = options[1]; // eslint-disable-line prefer-destructuring
	} else {
		arrayToUse = options[0]; // eslint-disable-line prefer-destructuring
	}

	const firstArray = arrayToUse.menuOptions;

	firstArray.forEach((element, index) => {
		elements.push({
			content_type: 'text',
			title: element,
			payload: arrayToUse.menuPostback[index],
		});
	});

	return { quick_replies: elements };
};

module.exports.sendShare = async (context, links) => {
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements: [
				{
					title: links.siteTitle,
					subtitle: links.siteSubTitle,
					image_url: links.imageURL,
					item_url: links.siteURL,
					buttons: [{
						type: 'element_share',
					}],
				},
			],
		},
	});
};

// send a card carousel for the user to confirm which bairro he wants
module.exports.sendConselhoConfirmation = async (context, items) => {
	const elements = [];

	items.forEach((element) => {
		elements.push({
			title: `Bairro ${element.bairro}`,
			subtitle: `CCS ${element.id}`,
			buttons: [{
				type: 'postback',
				title: 'É esse!',
				payload: `confirmBa${element.id}`,
			}],
		});
	});

	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements,
		},
	});
};

// send a card carousel for the user to confirm which municipio he wants
module.exports.sendMunicipioConfirmation = async (context, items) => {
	const elements = [];

	items.forEach((element) => {
		elements.push({
			title: `Município ${element.municipio}`,
			subtitle: `CCS ${element.id}`,
			buttons: [{
				type: 'postback',
				title: 'É esse!',
				payload: `confirmMu${element.id}`,
			}],
		});
	});

	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements,
		},
	});
};

// same as sendConselhoConfirmation but centro needs to use "regiao_novo" e "meta_regiao"
module.exports.sendCentroConfirmation = async (context, items) => {
	const elements = [];

	items.forEach((element) => {
		let bairroText = 'Bairros'; // check if there's only one bairro on this meta_regiao
		if (!element.meta_regiao.includes(',')) { bairroText = 'Bairro'; }
		if (element.regiao_novo.includes('Região')) { element.regiao_novo = element.regiao_novo.replace('Região', ''); } // eslint-disable-line no-param-reassign
		elements.push({
			title: `Região ${element.regiao_novo}`,
			subtitle: `${bairroText}: ${element.meta_regiao.replace(/,(?=[^,]*$)/, ' e')}`,
			buttons: [{
				type: 'postback',
				title: 'É esse!',
				payload: `confirmBa${element.id}`,
			}],
		});
	});

	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements,
		},
	});
};

// same as sendConselhoConfirmation but centro needs to use "regiao_novo" e "meta_regiao"
module.exports.sendColegioConfirmation = async (context, items) => {
	const elements = [];

	items.forEach((element) => {
		elements.push({
			title: `Região ${element.regiao_novo}`,
			subtitle: element.meta_regiao,
			buttons: [{
				type: 'postback',
				title: 'É essa!',
				payload: `confirmBa${element.id}`,
			}],
		});
	});

	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements,
		},
	});
};
