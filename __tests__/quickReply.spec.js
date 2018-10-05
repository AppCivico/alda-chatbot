require('dotenv').config();

const flow = require('../app/flow');
const handler = require('../app/handler');
const attach = require('../app/attach');
const cont = require('./context');
const help = require('../app/helpers');

jest.mock('../app/helpers');

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
	const context = cont.quickReplyContext(flow.aboutMe.menuPostback[0], 'whichCCS', { bairro: 'Caju', ccs: 'CCS São Cristovão' }, 'Caju');
	context.state.CCS = { bairro: 'Caju', ccs: 'CCS São Cristovão' };
	context.state.bairro = 'Caju';

	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.secondMessage);
	await expect(context.typingOn).toBeCalledWith();
	await expect(context.sendImage).toBeCalledWith(flow.whichCCS.CCSImage);
	await expect(context.typingOff).toBeCalledWith();
	await expect(context.state.retry_count).toBe(0);
	await expect(context.sendText).toBeCalledWith(`${flow.whichCCS.remember} ${context.state.CCS.bairro} ` +
		`${flow.whichCCS.remember2} ${context.state.CCS.ccs}.`);
	await expect(context.sendText).toBeCalledWith(flow.foundLocation.secondMessage, await attach.getQR(flow.whichCCSMenu));
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
	const context = cont.quickReplyContext(flow.whichCCS.menuPostback[0], 'sendLocation');
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

// it('findLocation-Success', async () => {
// 	const context = cont.quickReplyContext('findLocation', 'findLocation');
// 	// const googleMapsClienta = { reverseGeocode: cont.fakeGeo };

// 	await handler(context);


// 	// await expect(context.setState).toBeCalledWith({
// 	// 	mapsResults: await cont.fakeGeo({
// 	// 		latlng: [context.state.geoLocation.lat, context.state.geoLocation.long],
// 	// 		language: 'pt-BR',
// 	// 	}),
// 	// });
// 	await expect(context.setState).toBeCalledWith({ dialog: 'findLocation' });

// 	await expect(context.setState).toBeCalledWith({ mapsResults: '' });
// 	// await cont.fakeGeo({
// 	// 	latlng: [context.state.geoLocation.lat, context.state.geoLocation.long],
// 	// 	language: 'pt-BR',
// 	// }).then(async (response) => {
// 	// 	await expect(context.typingOff).toBeCalledWith();
// 	// 	await expect(context.sendText).toBeCalledWith(`${flow.confirmLocation.firstMessage}\n${response.json.results[0].formatted_address}`);
// 	// 	await expect(context.sendText).toBeCalledWith(flow.foundLocation.secondMessage, await attach.getQR(flow.foundLocation));
// 	// }).catch(() => {});
// });

it('wantToType1 from CCSMenu', async () => {
	const context = cont.quickReplyContext(flow.whichCCS.menuPostback[1], 'wantToType1');
	context.state.retryCount = 0;
	await handler(context);
	await expect(context.setState).toBeCalledWith({ geoLocation: undefined, bairro: undefined });
	await expect(context.setState).toBeCalledWith({ retryCount: context.state.retryCount + 1 });
	await expect(context.state.retryCount > 3).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.wantToType.firstMessage);
});

it('wantToType2 - couldt get sugestao', async () => {
	// this situation can't really happen with a quick_reply, this is a follow-up to "wantToType1 - entered rio de janeiro"
	const context = cont.quickReplyContext('wantToType2', 'wantToType2');
	context.state.municipiosFound = [{}];
	context.state.unfilteredBairros = [];
	context.state.sugestaoBairro = [];
	await handler(context);

	await expect(context.setState).toBeCalledWith({ retryCount: 0 });
	await expect(context.setState).toBeCalledWith({ unfilteredBairros: await help.listBairros(context.state.municipiosFound) });
	await expect(context.setState).toBeCalledWith({ sugestaoBairro: await context.state.unfilteredBairros.filter((item, pos, self) => self.indexOf(item) === pos) });
	await expect(!context.state.sugestaoBairro || context.state.sugestaoBairro.length === 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(`Legal. Agora digite o bairro da cidade ${context.state.municipiosFound[0].regiao}.`);
});

it('wantToType2 - got sugestao', async () => {
	// this situation can't really happen with a quick_reply, this is a follow-up to "wantToType1 - entered rio de janeiro"
	const context = cont.quickReplyContext('wantToType2', 'wantToType2');
	context.state.municipiosFound = [{}];
	context.state.unfilteredBairros = [];
	context.state.sugestaoBairro = [{ foo: 'bar' }];
	await handler(context);

	await expect(context.setState).toBeCalledWith({ retryCount: 0 });
	await expect(context.setState).toBeCalledWith({ unfilteredBairros: await help.listBairros(context.state.municipiosFound) });
	await expect(context.setState).toBeCalledWith({ sugestaoBairro: await context.state.unfilteredBairros.filter((item, pos, self) => self.indexOf(item) === pos) });
	await expect(!context.state.sugestaoBairro || context.state.sugestaoBairro.length === 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(`Legal. Agora digite o bairro da cidade ${context.state.municipiosFound[0].regiao}. `
        + `Você pode tentar bairros como ${context.state.sugestaoBairro.join(', ').replace(/,(?=[^,]*$)/, ' ou')}.`);
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

it('nearestLocation - wentAlready', async () => {
	const context = cont.quickReplyContext(flow.nearestCouncil.menuPostback[0], 'wentAlready');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.wentAlready.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.wentAlready.secondMessage, await attach.getQR(flow.wentAlready));
});

it('nearestLocation - neverWent + menu', async () => {
	const context = cont.quickReplyContext(flow.nearestCouncil.menuPostback[1], 'neverWent');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.nearestCouncil.neverWent);
	await expect(context.setState).toBeCalledWith({ dialog: 'wentAlreadyMenu' });

	context.state.dialog = 'wentAlreadyMenu';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.wentAlready.secondMessage, await attach.getQR(flow.wentAlready));
});

// it('wannaKnowMembers - wannaKnowMembers + carousel', async () => { Review this
// 	const context = cont.quickReplyContext(flow.wentAlready.menuPostback[0], 'wannaKnowMembers');
// 	context.state.CCS = {
// 		cod_ccs: true,
// 	};
// 	await handler(context);
// 	await expect(context.typingOn).toBeCalledWith();
// 	await expect(context.setState).toBeCalledWith({ diretoria: await db.getDiretoria(context.state.CCS.cod_ccs) });
// 	await expect(context.sendText).toBeCalledWith(`${flow.wannaKnowMembers.firstMessage} ${context.state.CCS.ccs}`);
// 	await expect(attach.sendCarousel).toBeCalledWith(context, context.state.diretoria);
// 	await expect(context.sendText).toBeCalledWith(flow.wannaKnowMembers.secondMessage);
// });

it('wannaKnowMembers - notWannaKnow + menu', async () => {
	const context = cont.quickReplyContext(flow.wentAlready.menuPostback[1], 'wentAlreadyMenu');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.councilMenu.notNow);
	await expect(context.setState).toBeCalledWith({ dialog: 'councilMenu' });

	context.state.dialog = 'councilMenu';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.councilMenu.firstMessage, await attach.getQR(flow.councilMenu));
	await expect(context.typingOff).toBeCalledWith();
});

