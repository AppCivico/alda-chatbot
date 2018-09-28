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

async function sendCentro(context, items) {
	const elements = [];

	items.forEach((element, index) => {
		elements.push({
			title: `Região ${index + 1}`,
			subtitle: `CCS ${element.id}`,
			buttons: [{
				type: 'postback',
				title: 'É esse!',
				payload: `centro${element.id}`,
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
}

module.exports.sendCentro = sendCentro;

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

