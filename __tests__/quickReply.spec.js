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
});

it('sendLocation from CCSMenu', async () => {
	const context = cont.quickReplyContext(flow.foundLocation.menuPostback[0], 'sendLocation');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.sendLocation.firstMessage);
	await expect(context.sendText).toBeCalledWith(flow.sendLocation.secondMessage, { quick_replies: [{ content_type: 'location' }] });
});

it('sendLocation-send free text', async () => {
	const context = cont.textContext('Caju', 'sendLocation');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ address: context.event.message.text });
	await expect(context.setState).toBeCalledWith({ dialog: 'confirmLocation' });
});

it('wantToType from CCSMenu', async () => {
	const context = cont.quickReplyContext(flow.foundLocation.menuPostback[1], 'wantToType');
	await handler(context);
	await expect(context.sendText).toBeCalledWith(flow.wantToType.firstMessage);
});

