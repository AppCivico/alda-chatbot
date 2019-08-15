require('dotenv').config();

const { MessengerClient } = require('messaging-api-messenger');

const testFolder = './.sessions/';
const fs = require('fs');

const config = require('./app/bottender.config').messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

const { postRecipientLabel } = require('./app/chatbot_api');
const { getPoliticianData } = require('./app/chatbot_api');
const { listAllLabels } = require('./app/postback');

const pageID = process.env.PAGE_ID;


async function load() {
	const allLabels = await listAllLabels(); // get all labels on the apge

	const politicianData = await getPoliticianData(pageID); // need politician id
	console.log(`Id do ${politicianData.name}:`, politicianData.id);

	fs.readdirSync(testFolder).forEach(async (file) => {
		const obj = JSON.parse(await fs.readFileSync(testFolder + file, 'utf8'));
		const userLabels = await client.getAssociatedLabels(obj.user.id); // get user labels

		for (let i = 0; i < userLabels.data.length; i++) {
			const currentLabel = userLabels.data[i];
			const labelDetailed = await allLabels.data.find(x => x.id === currentLabel.id); // compare ids to get the name

			if (labelDetailed) {
				const response = await postRecipientLabel(politicianData.id, obj.user.id, labelDetailed); // save the new label
				console.log('resposta do post da plataforma', response);
			}
		}
	});
}

load();
