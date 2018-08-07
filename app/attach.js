// Module for sending attachments to bot
// context is the context from bot.onEvent
// links is the object from flow.js from the respective dialog

// function sendMenu(context, links) {
// 	context.sendAttachment({
// 		type: 'template',
// 		payload: {
// 			template_type: 'generic',
// 			elements: [
// 				{
// 					title: links.siteTitle,
// 					image_url: links.imageURL,
// 					// subtitle: 'dasd',
// 					default_action: {
// 						type: 'web_url',
// 						url: links.siteURL,
// 						messenger_extensions: 'false',
// 						webview_height_ratio: 'full',
// 					// fallback_url: 'www.google.com',
// 					},
// 					buttons: [
// 					// {
// 					// 	type: 'web_url',
// 					// 	url: 'www.google.com',
// 					// 	title: 'Ver site',
// 					// }, {
// 						{
// 							type: 'postback',
// 							title: 'Entendi',
// 							payload: 'mainMenu',
// 						},
// 					],
// 				},
// 			],
// 		},
// 	});
// }

// module.exports.sendMenu = sendMenu;

async function sendCarousel(context, links) {
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements: links,
		},
	});
}

module.exports.sendCarousel = sendCarousel;

// sends one card with an image
async function sendCard(context, links) {
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements: [
				{
					title: links.title,
					subtitle: links.sub,
					image_url: links.imageLink,
					default_action: {
						type: 'web_url',
						url: links.link,
						messenger_extensions: 'false',
						webview_height_ratio: 'full',
					},
				},
			],
		},
	});
}


module.exports.sendCard = sendCard;

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

