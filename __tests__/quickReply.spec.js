require('dotenv').config();

const flow = require('../app/flow');
const handler = require('../app/handler');
const attach = require('../app/attach');
const cont = require('./context');

it('aboutMe-Claro', async () => {
	const context = cont.quickReplyContext(flow.greetings.menuPostback[0], 'aboutMe');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.secondMessage);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.thirdMessage, await attach.getQR(flow.aboutMe));
});

it('aboutMe-Agora Não', async () => {
	const context = cont.quickReplyContext(flow.greetings.menuPostback[1], 'aboutMe');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.notNow);
	await expect(context.setState).toBeCalledWith({ dialog: 'aboutMeMenu' });

	context.state.dialog = 'aboutMeMenu';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.thirdMessage, await attach.getQR(flow.aboutMe));
});

it('whichCCS-Claro-if', async () => {
	const context = cont.quickReplyContext(flow.aboutMe.menuPostback[0], 'whichCCS');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.secondMessage);
	await expect(context.typingOn).toBeCalledWith();
	await expect(context.sendImage).toBeCalledWith(flow.whichCCS.CCSImage);
	await expect(context.typingOff).toBeCalledWith();
	await expect(context.state.retry_count).toBe(0);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.thirdMessage, await attach.getQR(flow.whichCCS));
});

it('whichCCS-Claro-else', async () => {
	const context = cont.quickReplyContext(flow.aboutMe.menuPostback[0], 'whichCCS', 'CCS São Cristóvão', 'Caju');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.secondMessage);
	await expect(context.typingOn).toBeCalledWith();
	await expect(context.sendImage).toBeCalledWith(flow.whichCCS.CCSImage);
	await expect(context.typingOff).toBeCalledWith();
	await expect(context.state.retry_count).toBe(0);
	await expect(context.sendText).toBeCalledWith(`${flow.whichCCS.remember} ${context.state.userLocation.neighborhood.long_name} ` +
        `${flow.whichCCS.remember2} ${context.state.CCS.council}.`);
	await expect(context.sendText).toBeCalledWith(flow.foundLocation.secondMessage, await attach.getQR(flow.foundLocation));
});

it('whichCCS-Agora Não', async () => {
	const context = cont.quickReplyContext(flow.aboutMe.menuPostback[1], 'whichCCS');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.notNow);
	await expect(context.setState).toBeCalledWith({ dialog: 'whichCCSMenu' });

	context.state.dialog = 'whichCCSMenu';
	await handler(context);
	await expect(context.setState).toBeCalledWith({ retryCount: 0 });
	// TODO
});

it('sendLocation from CCSMenu', async () => {
	const context = cont.quickReplyContext(flow.foundLocation.menuPostback[0], 'sendLocation');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.sendLocation.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.sendLocation.secondMessage, { quick_replies: [{ content_type: 'location' }] });
});


it('sendLocation-send coordinates', async () => {
	const context = cont.getLocation('sendLocation');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ geoLocation: context.event.location.coordinates });
	await expect(context.setState).toBeCalledWith({ dialog: 'findLocation' });
});

it('wantToType from CCSMenu', async () => {
	const context = cont.quickReplyContext(flow.foundLocation.menuPostback[1], 'wantToType');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.wantToType.firstMessage);
});

it('findLocation-Success', async () => {
	const context = cont.quickReplyContext(flow.foundLocation.menuPostback[0], 'findLocation');
	await handler(context);
	await expect(context.typingOn).toBeCalledWith();
	cont.fakeGeo({
		latlng: [context.state.geoLocation.lat, context.state.geoLocation.long],
		language: 'pt-BR',
	}).then(async (response) => {
		await expect(context.typingOff).toBeCalledWith();
		await expect(context.sendText).toBeCalledWith(`${flow.confirmLocation.firstMessage}\n${response.json.results[0].formatted_address}`);
		await expect(context.sendText).toBeCalledWith(flow.foundLocation.secondMessage, await attach.getQR(flow.foundLocation));
	}).catch(() => {});
});

// it('findLocation-Failure', async () => {
// 	const context = cont.quickReplyContext(flow.foundLocation.menuPostback[0], 'findLocation');
// 	await handler(context);
// 	await expect(context.typingOn).toBeCalledWith();

// 	cont.fakeGeo({
// 		latlng: [context.state.geoLocation.lat, context.state.geoLocation.long],
// 		language: 'pt-PT', // <- forced error
// 	// }).then(() => {
// 	}).catch(async (err) => {
// 		await expect(context.typingOff).toBeCalledWith();
// 		expect(console.log).toBeCalledWith('Couldn\'t get geolocation => ');
// 		expect(console.log).toBeCalledWith(err);
// 		await expect(context.sendText).toBeCalledWith(flow.confirmLocation.noFindGeo);
// 		await expect(context.sendText).toBeCalledWith(flow.confirmLocation.noSecond, await attach.getQR(flow.notFound));
// 	});
// });

it('nearestLocation - neverWent', async () => {
	const context = cont.quickReplyContext(flow.nearestCouncil.menuPostback[1], 'neverWent');
	await handler(context);

	await expect(context.sendText).toBeCalledWith(flow.nearestCouncil.neverWent);
	await expect(context.setState).toBeCalledWith({ dialog: 'wentAlreadyMenu' });

	context.state.dialog = 'wentAlreadyMenu';
	await handler(context);

	await expect(context.sendText).toBeCalledWith(flow.wentAlready.secondMessage, await attach.getQR(flow.wentAlready));
});
