require('dotenv').config();

const cont = require('./context');
const flow = require('../app/flow');
const attach = require('../app/attach');
const events = require('../app/events');
const help = require('../app/helpers');
const geoHelp = require('../app/geo_aux');
const metric = require('../app/DB_metrics');
const appcivicoApi = require('../app/chatbot_api');
const db = require('../app/DB_helper');
const dialogs = require('../app/dialogs');
const { postRecipient } = require('../app/chatbot_api');
const geoResults = require('./geoResults');


jest.mock('../app/attach');
jest.mock('../app/chatbot_api');
jest.mock('../app/DB_metrics');
jest.mock('../app/broadcast');
jest.mock('../app/events');
jest.mock('../app/send_issue');
jest.mock('../app/dialogFlow');
jest.mock('../app/DB_helper');
jest.mock('../app/helpers');

it('findGeoLocation - error', async () => {
	const context = cont.quickReplyContext();
	context.state.mapsResultsFull = { status: 400 };
	await dialogs.findGeoLocation(context);

	await expect(context.setState).toBeCalledWith({ municipiosFound: '', bairro: '' });
	// --
	await expect(context.state.mapsResultsFull.status === 200).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.foundLocation.noFindGeo);
	await expect(context.sendText).toBeCalledWith(flow.foundLocation.noSecond, await attach.getQRLocation(flow.geoMenu));
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Erro com a localizacao');
});

it('findGeoLocation - not in rio', async () => {
	const context = cont.quickReplyContext();
	context.state.mapsResultsFull = { status: 200, json: {} };

	context.state.mapsResults = geoResults.notInRJ;
	await dialogs.findGeoLocation(context);

	await expect(context.setState).toBeCalledWith({ municipiosFound: '', bairro: '' });
	// --
	await expect(context.state.mapsResultsFull.status === 200).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ mapsResults: context.state.mapsResultsFull.json.results });
	await expect(context.setState).toBeCalledWith({ mapsResultsFull: '' });

	await expect(await geoHelp.checkIfInRio(context.state.mapsResults) === true).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.sendLocation.notInRioState, await attach.getQRLocation(flow.geoMenu));
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Usuario-Geo Nao esta no RJ');
});

it('findGeoLocation - in rio, no city found', async () => {
	const context = cont.quickReplyContext();
	context.state.mapsResultsFull = { status: 200, json: {} };
	context.state.mapsResults = geoResults.inRJ;

	await dialogs.findGeoLocation(context);

	await expect(context.setState).toBeCalledWith({ municipiosFound: '', bairro: '' });
	await expect(context.state.mapsResultsFull.status === 200).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ mapsResults: context.state.mapsResultsFull.json.results });
	await expect(context.setState).toBeCalledWith({ mapsResultsFull: '' });
	await expect(await geoHelp.checkIfInRio(context.state.mapsResults) === true).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ mapsCity: await geoHelp.getCityFromGeo(context.state.mapsResults) });
	await expect(!context.state.mapsCity).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.foundLocation.noFindGeo);
	await expect(context.sendText).toBeCalledWith(flow.foundLocation.noSecond, await attach.getQR(flow.notFound));
});

it('findGeoLocation - in rio, not Rio de Janeiro city', async () => {
	const context = cont.quickReplyContext();
	context.state.mapsResultsFull = { status: 200, json: {} };
	context.state.mapsResults = geoResults.inRJ;
	context.state.mapsCity = 'Niterói';
	await dialogs.findGeoLocation(context);

	await expect(context.setState).toBeCalledWith({ municipiosFound: '', bairro: '' });
	await expect(context.state.mapsResultsFull.status === 200).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ mapsResults: context.state.mapsResultsFull.json.results });
	await expect(context.setState).toBeCalledWith({ mapsResultsFull: '' });
	await expect(await geoHelp.checkIfInRio(context.state.mapsResults) === true).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ mapsCity: await geoHelp.getCityFromGeo(context.state.mapsResults) });

	await expect(!context.state.mapsCity).toBeFalsy();
	await expect(context.state.mapsCity.toLowerCase() === 'rio de janeiro').toBeFalsy();
	await expect(context.setState).toBeCalledWith({ CCSGeo: await db.getCCSsFromMunicipio(await help.formatString(context.state.mapsCity)) });
	await expect(context.sendText).toBeCalledWith(`${flow.foundLocation.firstMessage} ${context.state.mapsCity}`);
	await expect(context.sendText).toBeCalledWith(flow.foundLocation.secondMessage, await attach.getQRLocation2(flow.foundLocation));
});

it('findGeoLocation - in rio, Rio de Janeiro city, no bairro', async () => {
	const context = cont.quickReplyContext();
	context.state.mapsResultsFull = { status: 200, json: {} };
	context.state.mapsResults = geoResults.inRJ;
	context.state.mapsCity = await geoHelp.getCityFromGeo(context.state.mapsResults);
	await dialogs.findGeoLocation(context);

	await expect(context.setState).toBeCalledWith({ municipiosFound: '', bairro: '' });
	await expect(context.state.mapsResultsFull.status === 200).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ mapsResults: context.state.mapsResultsFull.json.results });
	await expect(context.setState).toBeCalledWith({ mapsResultsFull: '' });
	await expect(await geoHelp.checkIfInRio(context.state.mapsResults) === true).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ mapsCity: await geoHelp.getCityFromGeo(context.state.mapsResults) });

	await expect(!context.state.mapsCity).toBeFalsy();
	await expect(context.state.mapsCity.toLowerCase() === 'rio de janeiro').toBeTruthy();
	await expect(context.setState).toBeCalledWith({ mapsBairro: await geoHelp.getNeighborhood(context.state.mapsResults[0].address_components) });
	await expect(context.setState).toBeCalledWith({ mapsResults: '' });
	await expect(context.state.mapsBairro).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.foundLocation.noFindGeo);
	await expect(context.sendText).toBeCalledWith(flow.foundLocation.noSecond, await attach.getQR(flow.notFound));
	await expect(events.addCustomAction).toBeCalledWith(context.session.user.id, 'Erro com a localizacao');
});
