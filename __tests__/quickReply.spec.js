require('dotenv').config();

const cont = require('./context');
const flow = require('../app/flow');
const handler = require('../app/handler');
const attach = require('../app/attach');
const events = require('../app/events');
const appcivicoApi = require('../app/chatbot_api');
const help = require('../app/helpers');
const dialogs = require('../app/dialogs');

jest.mock('../app/attach');
jest.mock('../app/DB_helper');
jest.mock('../app/helpers');
jest.mock('../app/broadcast');
jest.mock('../app/events');
jest.mock('../app/chatbot_api');
jest.mock('../app/send_issue');
jest.mock('../app/dialogFlow');
jest.mock('../app/dialogs');

it('aboutMe-Claro', async () => {
	const context = cont.quickReplyContext(flow.greetings.menuPostback[0], 'aboutMe');
	await handler(context);

	await expect(context.setState).toBeCalledWith({ politicianData: await appcivicoApi.getPoliticianData(context.event.rawEvent.recipient.id) });
	await expect(appcivicoApi.postRecipient).toBeCalledWith(context.state.politicianData.user_id, {
		fb_id: context.session.user.id,
		name: `${context.session.user.first_name} ${context.session.user.last_name}`,
		gender: context.session.user.gender === 'male' ? 'M' : 'F',
		origin_dialog: 'greetings',
		picture: context.session.user.profile_pic,
		// session: JSON.stringify(context.state),
	});

	await expect(context.sendText).toBeCalledWith(flow.aboutMe.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.secondMessage);
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario quer saber mais Alda');
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.thirdMessage, await attach.getQR(flow.aboutMe));
});

it('aboutMe-Agora Não', async () => {
	const context = cont.quickReplyContext(flow.greetings.menuPostback[1], 'greetings');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.notNow);
	await expect(context.setState).toBeCalledWith({ dialog: 'aboutMeMenu' });

	context.state.dialog = 'aboutMeMenu';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.thirdMessage, await attach.getQR(flow.aboutMe));
});

it('whichCCS-Claro-if-no css', async () => {
	const context = cont.quickReplyContext(flow.aboutMe.menuPostback[0], 'whichCCS');
	await handler(context);
	await expect(context.typingOn).toBeCalled();
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.secondMessage);
	await expect(context.sendImage).toBeCalledWith(flow.whichCCS.CCSImage);
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario quer saber mais CCS');
	await expect(context.typingOff).toBeCalled();
	await expect(context.state.retry_count).toBe(0);

	await expect(context.sendText).toBeCalledWith(flow.whichCCS.thirdMessage, await attach.getQR(flow.whichCCS));
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Pedimos Conselho ao Usuario');
});

it('whichCCS-Claro-else-with css', async () => {
	const context = cont.quickReplyContext(flow.aboutMe.menuPostback[0], 'whichCCS');
	context.state.CCS = { bairro: 'Caju', ccs: 'CCS São Cristovão' };
	context.state.bairro = 'Caju';

	await handler(context);
	await expect(context.typingOn).toBeCalled();
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.secondMessage);
	await expect(context.sendImage).toBeCalledWith(flow.whichCCS.CCSImage);
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario quer saber mais CCS');
	await expect(context.typingOff).toBeCalled();
	await expect(context.state.retry_count).toBe(0);

	await expect(context.sendText).toBeCalledWith(`${flow.whichCCS.remember} ${await help.getRememberComplement(context.state.CCS)} `
		+ `${flow.whichCCS.remember2} ${context.state.CCS.ccs}.`);
	await expect(context.sendText).toBeCalledWith(flow.foundLocation.secondMessage, await attach.getQR(flow.whichCCSMenu));
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Lembramos Usuario do seu Conselho');
});

it('whichCCS-Agora Não', async () => {
	const context = cont.quickReplyContext(flow.aboutMe.menuPostback[1], 'whichCCS');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.notNow);
	await expect(context.setState).toBeCalledWith({ dialog: 'whichCCSMenu' });
	await expect(context.setState).toBeCalledWith({ retryCount: 0 });
	// follows whichCCS tests above
});

it('sendLocation from CCSMenu', async () => {
	const context = cont.quickReplyContext('sendLocation', 'sendLocation');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.sendLocation.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.sendLocation.secondMessage);
	await expect(context.sendText).toBeCalledWith(flow.sendLocation.thirdMessage, await attach.getQRLocation(flow.sendLocation));
});

it('sendLocation-send coordinates', async () => {
	const context = cont.getLocation('sendLocation');
	await handler(context);

	await expect(context.setState).toBeCalledWith({ geoLocation: context.event.location.coordinates });
	await expect(context.setState).toBeCalledWith({ dialog: 'findLocation' });
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario envia localizacao');
	await expect(context.setState).toBeCalledWith({ municipiosFound: undefined, bairro: undefined });
});

it('wantToType1 from CCSMenu', async () => {
	const context = cont.quickReplyContext(flow.whichCCS.menuPostback[1], 'retryType');
	context.state.retryCount = 0;
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.wantToType.retryType);
	await expect(context.setState).toBeCalledWith({ geoLocation: undefined, bairro: undefined });
	await expect(context.setState).toBeCalledWith({ retryCount: context.state.retryCount + 1 });
});

it('wantToType1 from CCSMenu', async () => {
	const context = cont.quickReplyContext(flow.whichCCS.menuPostback[1], 'wantToType1');
	context.state.retryCount = 0;
	await handler(context);
	await expect(context.setState).toBeCalledWith({ geoLocation: undefined, bairro: undefined });
	await expect(context.setState).toBeCalledWith({ retryCount: context.state.retryCount + 1 });
	await expect(context.state.retryCount > 3).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.wantToType.firstMessage);
});

it('wantToType1 - 4 tries', async () => {
	const context = cont.quickReplyContext(flow.whichCCS.menuPostback[1], 'wantToType1');
	context.state.retryCount = 4;
	await handler(context);
	await expect(context.setState).toBeCalledWith({ geoLocation: undefined, bairro: undefined });
	await expect(context.setState).toBeCalledWith({ retryCount: context.state.retryCount + 1 });
	await expect(context.state.retryCount > 3).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ retryCount: 0 });
	await expect(context.sendText).toBeCalledWith(`${flow.wantToType.firstMessage}\n${flow.wantToChange.helpMessage}`, await attach.getQR(flow.wantToChange));
});

it('wantToType2 - no bairros', async () => {
	const context = cont.quickReplyContext('wantToType2', 'wantToType2');
	context.state.municipiosFound = []; context.state.unfilteredBairros = []; context.state.sugestaoBairro = [];
	await handler(context);
	await expect(context.setState).toBeCalledWith({ retryCount: 0 });
	await expect(context.setState).toBeCalledWith({ unfilteredBairros: await help.listBairros(context.state.municipiosFound) });
	await expect(context.setState).toBeCalledWith({	sugestaoBairro: await context.state.unfilteredBairros.filter((item, pos, self) => self.indexOf(item) === pos) });
	await expect(!context.state.sugestaoBairro || context.state.sugestaoBairro.length === 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.wantToType2.noSugestao);
	await events.addCustomAction({ sugestaoBairro: await context.state.unfilteredBairros.filter((item, pos, self) => self.indexOf(item) === pos) });
});

it('wantToType2 - with sugestao', async () => {
	const context = cont.quickReplyContext('wantToType2', 'wantToType2');
	context.state.municipiosFound = []; context.state.unfilteredBairros = []; context.state.sugestaoBairro = [{ foo: 'bar' }];
	await handler(context);
	await expect(context.setState).toBeCalledWith({ retryCount: 0 });
	await expect(context.setState).toBeCalledWith({ unfilteredBairros: await help.listBairros(context.state.municipiosFound) });
	await expect(context.setState).toBeCalledWith({	sugestaoBairro: await context.state.unfilteredBairros.filter((item, pos, self) => self.indexOf(item) === pos) });
	await expect(!context.state.sugestaoBairro || context.state.sugestaoBairro.length === 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.wantToType2.withSugestao.replace('<sugestao>', context.state.sugestaoBairro.join(', ')));
	await events.addCustomAction({ sugestaoBairro: await context.state.unfilteredBairros.filter((item, pos, self) => self.indexOf(item) === pos) });
});

it('nearestLocation - wentAlready', async () => {
	const context = cont.quickReplyContext(flow.nearestCouncil.menuPostback[0], 'wentAlready');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.wentAlready.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.wentAlready.secondMessage, await attach.getQR(flow.wentAlready));
});

it('nearestLocation - neverWent + menu - no metric', async () => {
	const context = cont.quickReplyContext(flow.nearestCouncil.menuPostback[1], 'neverWent');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.nearestCouncil.neverWent);
	await expect(context.setState).toBeCalledWith({ dialog: 'wentAlreadyMenu' });

	context.state.dialog = 'wentAlreadyMenu';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.wentAlready.secondMessage, await attach.getQR(flow.wentAlready));
});

// TODO nearestLocation with metric (insert checkChatbotUser into updateWentBeforeChatbotUser)
// misc dialogs
// TODO notFoundFromGeo is a part of nearestCouncil

it('wannaKnowMembers - notWannaKnow + menu', async () => {
	const context = cont.quickReplyContext(flow.wentAlready.menuPostback[1], 'wentAlreadyMenu');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.councilMenu.notNow);
	await expect(context.setState).toBeCalledWith({ dialog: 'councilMenu' });

	context.state.dialog = 'councilMenu';
	await handler(context);
	await expect(dialogs.sendCouncilMenu).toBeCalledWith(context);
});

it('goBackMenu button', async () => {
	const context = cont.quickReplyContext('goBackMenu', 'goBackMenu');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.mainMenu.notNow);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });

	context.state.dialog = 'mainMenu';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.mainMenu.firstMessage, await attach.getQR(flow.mainMenu));
});

it('facebook button', async () => {
	const context = cont.quickReplyContext('facebook', 'facebook');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.userData.facebook);
	await expect(context.setState).toBeCalledWith({ dialog: 'userData' });

	context.state.dialog = 'userData';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.userData.menuMessage, await attach.getQR(flow.userData));
});

it('notCCS button', async () => {
	const context = cont.quickReplyContext('notCCS', 'notCCS');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.whichCCS.notNow);
	await expect(context.setState).toBeCalledWith({ dialog: 'whichCCSMenu' });

	context.state.dialog = 'whichCCSMenu';
	await handler(context);
	await expect(context.setState).toBeCalledWith({ retryCount: 0 });
});

it('notMe button', async () => {
	const context = cont.quickReplyContext('notMe', 'notMe');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.notNow);
	await expect(context.setState).toBeCalledWith({ dialog: 'aboutMeMenu' });

	context.state.dialog = 'aboutMeMenu';
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.aboutMe.thirdMessage, await attach.getQR(flow.aboutMe));
});

it('start', async () => {
	const context = cont.quickReplyContext('start', 'start');
	await handler(context);
	await expect(dialogs.sendGreetings).toBeCalledWith(context);
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario comeca dialogo');
});

it('greetings', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	await handler(context);
	await expect(dialogs.sendGreetings).toBeCalledWith(context);
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario ve Saudacoes');
});

it('join', async () => {
	const context = cont.quickReplyContext('join', 'join');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.join.firstMessage, await attach.getQR(flow.join));
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario quer fazer parte');
});

it('keepMe', async () => {
	const context = cont.quickReplyContext('keepMe', 'keepMe');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.keepMe.firstMessage, await attach.getQR(flow.keepMe));
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario quer manter-se informado');
});

it('share', async () => {
	const context = cont.quickReplyContext('share', 'share');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.share.firstMessage);
	await expect(attach.sendShare).toBeCalledWith(context, flow.share);
	await expect(context.sendText).toBeCalledWith(flow.share.secondMessage, await attach.getQR(flow.share));
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario quer compartilhar');
});

it('followMedia', async () => {
	const context = cont.quickReplyContext('followMedia', 'followMedia');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.followMedia.firstMessage);
	await expect(attach.sendCardWithLink).toBeCalledWith(context, flow.followMedia, flow.followMedia.link);
	await expect(context.sendText).toBeCalledWith(flow.followMedia.secondMessage, await attach.getQR(flow.followMedia));
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario quer seguir redes sociais');
});
