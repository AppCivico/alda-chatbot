require('dotenv').config();

const testFolder = './.sessions/';
const fs = require('fs');
const { postRecipient } = require('./app/chatbot_api');
const { getPoliticianData } = require('./app/chatbot_api');

const pageID = process.env.PAGE_ID;

async function load() {
	const politicianData = await getPoliticianData(pageID); // need politician id
	console.log(`Id do ${politicianData.name}:`, politicianData.id);

	fs.readdirSync(testFolder).forEach(async (file) => {
		const obj = JSON.parse(await fs.readFileSync(testFolder + file, 'utf8'));
		const resp = await postRecipient(politicianData.id, {
			fb_id: obj.user.id,
			name: `${obj.user.first_name} ${obj.user.last_name}`,
			gender: obj.user.gender === 'male' ? 'M' : 'F',
			origin_dialog: 'greetings',
			picture: obj.user.profile_pic,
			// session: JSON.stringify(context.state),
		});

		console.log(`resp do ${obj.user.first_name} ${obj.user.last_name}`, resp);
	});
}

load();
