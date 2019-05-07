require('dotenv').config();

const cont = require('./context');
const geoResults = require('./geoResults');
const flow = require('../app/flow');
const attach = require('../app/attach');
const events = require('../app/events');
const help = require('../app/helpers');
const geoHelp = require('../app/geo_aux');
const db = require('../app/DB_helper');
const dialogs = require('../app/dialogs');

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
	context.state.mapsResults = geoResults.inNiteroi;
	context.state.mapsCity = await geoHelp.getCityFromGeo(context.state.mapsResults);
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

it('findGeoLocation - in rio, Rio de Janeiro city, regular bairro', async () => {
	const context = cont.quickReplyContext();
	context.state.mapsResultsFull = { status: 200, json: {} };
	context.state.mapsResults = geoResults.inRJ;
	context.state.mapsCity = await geoHelp.getCityFromGeo(context.state.mapsResults);
	context.state.mapsBairro = await geoHelp.getNeighborhood(context.state.mapsResults[0].address_components);
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
	await expect(context.state.mapsBairro).toBeTruthy();
	await expect(context.state.mapsBairro === 'Paquetá').toBeFalsy();
	await expect(context.state.mapsBairro.toLowerCase() === 'centro' || context.state.mapsBairro.toLowerCase() === 'colégio').toBeFalsy();
	await expect(context.setState).toBeCalledWith({ CCSGeo: await db.getCCSsFromBairroExact(await help.formatString(context.state.mapsBairro)) });
	await expect(context.sendText).toBeCalledWith(`Encontrei o bairro ${context.state.mapsBairro} na cidade ${context.state.mapsCity}.`);
	await expect(context.sendText).toBeCalledWith(flow.foundLocation.secondMessage, await attach.getQRLocation2(flow.foundLocation));
});

it('findGeoLocation - in rio, Rio de Janeiro city, Paquetá bairro', async () => {
	const context = cont.quickReplyContext();
	context.state.mapsResultsFull = { status: 200, json: {} };
	context.state.mapsResults = geoResults.inPaqueta;
	context.state.mapsCity = await geoHelp.getCityFromGeo(context.state.mapsResults);
	context.state.mapsBairro = await geoHelp.getNeighborhood(context.state.mapsResults[0].address_components);
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
	await expect(context.state.mapsBairro).toBeTruthy();
	await expect(context.state.mapsBairro === 'Paquetá').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.sendLocation.inPaqueta, await attach.getQR(flow.checkPaqueta));
});

it('findGeoLocation - in rio, Rio de Janeiro city, Centro bairro', async () => {
	const context = cont.quickReplyContext();
	context.state.mapsResultsFull = { status: 200, json: {} };
	context.state.mapsResults = geoResults.inColegio;
	context.state.mapsCity = await geoHelp.getCityFromGeo(context.state.mapsResults);
	context.state.mapsBairro = await geoHelp.getNeighborhood(context.state.mapsResults[0].address_components);
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
	await expect(context.state.mapsBairro).toBeTruthy();
	await expect(context.state.mapsBairro === 'Paquetá').toBeFalsy();
	await expect(context.state.mapsBairro.toLowerCase() === 'centro' || context.state.mapsBairro.toLowerCase() === 'colégio').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(`Hmm, você está querendo saber sobre o bairro ${context.state.mapsBairro} na Capital do Rio? 🤔`, await attach.getQR(flow.checkBairro));
});
