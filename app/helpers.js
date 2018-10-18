const util = require('util');
const moment = require('moment');
const accents = require('remove-accents');
const postback = require('./postback');
const Sentry = require('@sentry/node');

Sentry.init({
	dsn: process.env.SENTRY_DSN, environment: process.env.ENV, captureUnhandledRejections: false,
});
module.exports.Sentry = Sentry;

moment.locale('pt-BR');
module.exports.moment = moment;

module.exports.urlExists = util.promisify(require('url-exists'));

function formatDate(date) {
	return `${moment(date).format('dddd')}, ${moment(date).format('D')} de ${moment(date).format('MMMM')} às ${moment(date).format('hh:mm')}`;
}
module.exports.formatDate = formatDate;

module.exports.formatDateDay = function formatDateDay(date) {
	return `${moment(date).format('D')} de ${moment(date).format('MMMM')}`;
};

module.exports.dateComparison = function formatDateDay(date) {
	return `${moment(date).format('YYYY-MM-DD')}`;
};


// find every object on municipios array with the same bairro (remove duplicated bairros)
module.exports.findCCSBairro = async function findCCSBairro(sameMunicipio, bairroTyped) {
	const theBairros = [];
	const duplicated = [];
	await sameMunicipio.forEach(async (element) => {
		const aux = await accents.remove(element.bairro).toLowerCase();
		if (aux.includes(bairroTyped) && !duplicated.includes(aux)) {
			theBairros.push(element);
			duplicated.push(aux);
		}
	});
	return theBairros;
};

// find every object on municipios array with the same bairro (allows duplicated bairros if the conselho_id are different)
module.exports.findBairroCCSID = async function findBairroCCSID(sameMunicipio, wantedBairro) {
	const theBairros = [];
	const duplicated = [];
	await sameMunicipio.forEach(async (element) => {
		const aux = await accents.remove(element.bairro).toLowerCase();
		const auxID = element.id;
		if (aux.includes(wantedBairro) && !duplicated.includes(auxID)) {
			theBairros.push(element);
			duplicated.push(auxID);
		}
	});
	return theBairros;
};

// get n number of random elements from arr
function getRandom(arr, n) {
	const result = new Array(n);
	let len = arr.length;
	const taken = new Array(len);
	if (n > len) { throw new RangeError('getRandom: more elements taken than available'); }
	while (n--) { // eslint-disable-line
		const x = Math.floor(Math.random() * len);
		result[n] = arr[x in taken ? taken[x] : x];
		taken[x] = --len in taken ? taken[len] : len; // eslint-disable-line
	}
	return result;
}

module.exports.getAgendaMessage = async function getAgendaMessage(agenda) {
	let message = '';
	if (agenda.data && agenda.data !== '' && agenda.hora && agenda.hora !== '') { message = `🗓️ *Data*: ${formatDate(new Date(`${agenda.data} ${agenda.hora}`))}\n`; }
	if (agenda.bairro && agenda.bairro !== '') { message = `${message}🏘️ *Bairro*: ${agenda.bairro}\n`; }
	if (agenda.endereco && agenda.endereco !== '') { message = `${message}🏠 *Local*: ${agenda.endereco}\n`; }
	if (agenda.ponto_referencia && agenda.ponto_referencia !== '') { message = `${message}📍 *Ponto de Referência*: ${agenda.ponto_referencia}\n`; }
	return message;
};
module.exports.getAgendaMessageTimer = async function getAgendaMessageTimer(agenda, initialMessage) {
	let message = initialMessage;
	if (agenda.data && agenda.data !== '' && agenda.hora && agenda.hora !== '') { message = `${message}🗓️ *Nova Data*: ${formatDate(new Date(`${agenda.data} ${agenda.hora}`))}\n`; }
	if (agenda.bairro && agenda.bairro !== '') { message = `${message}🏘️ *Novo Bairro*: ${agenda.bairro}\n`; }
	if (agenda.endereco && agenda.endereco !== '') { message = `${message}🏠 *Novo Local*: ${agenda.endereco}\n`; }
	if (agenda.ponto_referencia && agenda.ponto_referencia !== '') { message = `${message}📍 *Ponto de Referência*: ${agenda.ponto_referencia}\n`; }
	return message;
};

module.exports.getNeighborhood = async (results) => {
	let neighborhood = results.find(x => x.types.includes('sublocality'));
	if (!neighborhood) { neighborhood = results.find(x => x.types.includes('sublocality_level_1')); }
	return neighborhood.long_name;
};
module.exports.checkIfInRio = async (results) => {
	let state = await results.find(x => x.types.includes('administrative_area_level_1')); // administrative_area_level_1 -> state
	if (!state) { state = await results.find(x => x.types.includes('administrative_area_level_2')); }

	let place = 'rio de janeiro';
	if (state.formatted_address) { place = state.formatted_address; }

	if ('rio de janeiro'.includes(place.toLowerCase()) || place.toLowerCase().includes('rio de janeiro')) { return true; }
	return false;
};

module.exports.getCityFromGeo = async (results) => {
	let state = await results.find(x => x.types.includes('administrative_area_level_2')); // administrative_area_level_2 -> city
	if (state) {
		state = await state.address_components.find(x => x.types.includes('administrative_area_level_2')); // administrative_area_level_2 -> city
		if (state.long_name) { return state.long_name; }
		return undefined;
	}
	return undefined;
};

module.exports.getRememberComplement = async (ccs) => {
	if (!ccs.bairro || ccs.bairro.length === 0) {
		return `município ${ccs.municipio}`;
	}
	return `bairro ${ccs.bairro}`;
};

module.exports.listBairros = function listBairros(ccs) {
	let bairros = [];

	if (ccs && ccs.length > 0) {
		ccs.forEach((element) => {
			bairros.push(element.bairro);
		});
		bairros = getRandom(bairros, 5);
		return [...new Set(bairros)]; // set stores only unique values
	}
	return undefined;
};

async function formatString(text) {
	let result = text.toLowerCase();
	result = await result.replace(/([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF])/g, '');
	// result = await result.replace(/ç/g, 'c');
	result = await result.replace(/´|~|\^|`|'|0|1|2|3|4|5|6|7|8|9|/g, '');
	result = await accents.remove(result);
	return result.trim();
}
module.exports.formatString = formatString;

// link an user to an agendaLabel
// each angendaLabel is 'agenda' + 'ID of the CCS' -> agenda1110
// All of the are going to be created and associated
async function linkUserToCustomLabel(labelName, UserID) { // eslint-disable-line no-unused-vars
	const ourLabels = await postback.listAllLabels(); // get all labels we have
	const theOneLabel = await ourLabels.data.find(x => x.name === labelName); // find the one label with the name same (we need the id)

	if (theOneLabel) { // if we already have that label, all we have to do is associate the user to the id
		return postback.associatesLabelToUser(UserID, theOneLabel.id);
	}
	// no theOneLabel exists so we have to create it
	const newLabel = await postback.createNewLabel(labelName);
	if (!newLabel.error) { // no errors, so we can add the user to the label
		return postback.associatesLabelToUser(UserID, newLabel.id);
	}
	return newLabel;
}

module.exports.linkUserToCustomLabel = linkUserToCustomLabel;

module.exports.getBroadcastMetrics = postback.getBroadcastMetrics;
module.exports.dissociateLabelsFromUser = postback.dissociateLabelsFromUser;
module.exports.getBroadcastMetrics = postback.getBroadcastMetrics;
module.exports.addUserToBlackList = postback.addUserToBlackList;
module.exports.removeUserFromBlackList = postback.removeUserFromBlackList;
module.exports.checkUserOnLabel = postback.checkUserOnLabel;
module.exports.getLabelID = postback.getLabelID;
