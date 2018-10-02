// Module for sending attachments to bot
// context is the context from bot.onEvent
// links is the object from flow.js from the respective dialog

async function sendCarousel(context, items) {
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
}

module.exports.sendCarousel = sendCarousel;


// sends one card with an image and link
module.exports.sendCardWithLink = async function sendCardWithLink(context, cardData, url, text) {
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
module.exports.getQR = async function getQR(opt) {
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
};

module.exports.getErrorQR = async function getErrorQR(opt, lastPostback) {
	const elements = [];
	const firstArray = opt.menuOptions;

	firstArray.forEach((element, index) => {
		elements.push({
			content_type: 'text',
			title: element,
			payload: opt.menuPostback[index],
		});
	});

	elements.push({
		content_type: 'text',
		title: 'Voltar',
		payload: lastPostback,
	});

	return { quick_replies: elements };
};

module.exports.getConditionalQR = async function getConditionalQR(options, useSecond) {
	const elements = [];
	let arrayToUse;
	if (useSecond === true) {
		arrayToUse = options[1]; // eslint-disable-line prefer-destructuring
	} else {
		arrayToUse = options[0]; // eslint-disable-line prefer-destructuring
	}

	const firstArray = arrayToUse.menuOptions;
	console.log('firstArray', firstArray);


	firstArray.forEach((element, index) => {
		elements.push({
			content_type: 'text',
			title: element,
			payload: arrayToUse.menuPostback[index],
		});
	});

	return { quick_replies: elements };
};

async function sendShare(context, links) {
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
}

module.exports.sendShare = sendShare;

// send a card carousel for the user to confirm which bairro he wants
module.exports.sendConselhoConfirmation = async function sendConselhoConfirmation(context, items) {
	const elements = [];

	items.forEach((element) => {
		elements.push({
			title: `Bairro ${element.bairro}`,
			subtitle: `CCS ${element.id}`,
			buttons: [{
				type: 'postback',
				title: 'É esse!',
				payload: `confirm${element.id}`,
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

// same as sendConselhoConfirmation but centro needs to use "região complementar" (not yet implemented)
module.exports.sendCentro = async function sendCentro(context, items) {
	const elements = [];

	items.forEach((element, index) => {
		elements.push({
			title: `Região ${index + 1}`,
			subtitle: `CCS ${element.id}`,
			buttons: [{
				type: 'postback',
				title: 'É esse!',
				payload: `confirm${element.id}`,
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
