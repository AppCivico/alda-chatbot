const util = require('util');
const moment = require('moment');
const accents = require('remove-accents');
const Sentry = require('@sentry/node');
const dialogFlow = require('apiai-promise');
const flow = require('./flow');
const postback = require('./postback');

Sentry.init({
	dsn: process.env.SENTRY_DSN, environment: process.env.ENV, captureUnhandledRejections: false,
});
module.exports.Sentry = Sentry;

moment.locale('pt-BR');
module.exports.moment = moment;


async function formatDialogFlow(text) {
	let result = text.toLowerCase();
	result = await result.replace(/([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF])/g, '');
	result = await accents.remove(result);
	if (result.length >= 250) {
		result = result.slice(0, 250);
	}
	return result.trim();
}

module.exports.urlExists = util.promisify(require('url-exists'));

function formatDate(date) {
	return `${moment(date).format('dddd')}, ${moment(date).format('D')} de ${moment(date).format('MMMM')} às ${moment(date).format('hh:mm')}`;
}
module.exports.formatDateDay = date => `${moment(date).format('D')} de ${moment(date).format('MMMM')}`;
async function dateComparison(date) { return `${moment(date).format('YYYY-MM-DD')}`; }
module.exports.capitalizeWords = str => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

module.exports.dateComparison = dateComparison;
module.exports.formatDate = formatDate;
module.exports.checkMenu = async (CCSID, oldOptions, db) => {
	// cheking which quick_reply options we can show in the menu
	// { quick_replies: await checkMenu(context, [flow.calendarOpt, flow.subjectsOpt, flow.resultsOpt, flow.joinOpt]) }
	// each flow._opt passed will be added to the final options if it's present and matches the requirements (like having an agenda to show subjects)
	const options = [];
	if (oldOptions.find(obj => obj.payload === 'calendar')) { options.push(flow.calendarOpt); }
	if (oldOptions.find(obj => obj.payload === 'subjects')) { // before checking the database we can check if we would have sent this optins in the first pplace
		const agenda = await db.getAgenda(CCSID); // getting agenda to check if we should send "subjects" option
		if (agenda && dateComparison(agenda.data) >= dateComparison(new Date())) { // we can send it
			options.push(flow.subjectsOpt);
		}
	}
	if (oldOptions.find(obj => obj.payload === 'results')) {
		const resuts = await db.getResults(CCSID); // check if we have a valid text to send
		if (resuts && resuts.texto && resuts.texto.length > 0 && resuts.texto.length <= 2000) {
			options.push(flow.resultsOpt); // we can send it
		}
	}
	if (oldOptions.find(obj => obj.payload === 'join')) { options.push(flow.joinOpt); }
	return options;
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

// separates string in the first dot on the second half of the string
module.exports.separateString = (someString) => {
	if (someString.trim()[someString.length - 1] !== '.') { // trying to guarantee the last char is a dot so we never use halfLength alone as the divisor
		someString += '.'; // eslint-disable-line no-param-reassign
	}
	const halfLength = Math.ceil(someString.length / 2.5); // getting more than half the length (the bigger the denominator the shorter the firstString tends to be)
	const newString = someString.substring(halfLength); // get the second half of the original string
	const sentenceDot = new RegExp('(?<!www)\\.(?!com|br|rj|sp|mg|bra|gov|org)', 'i');// Regex -> Don't consider dots present in e-mails and urls
	// getting the index (in relation to the original string -> halfLength) of the first dot on the second half of the string. +1 to get the actual dot.
	const dotIndex = halfLength + newString.search(sentenceDot) + 1;

	const firstString = someString.substring(0, dotIndex);
	const secondString = someString.substring(dotIndex);

	return { firstString, secondString };
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
	if (!neighborhood) { neighborhood = results.find(x => x.types.includes('sublocality_level_2')); }
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
async function linkUserToCustomLabel(UserID, labelName) { // eslint-disable-line no-unused-vars
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
module.exports.buildSeqAnswers = async (context) => {
	// check if button clicked came from the broadcast (length > 1 -> questionNumber + agendaId) containing the agendaID after the question number
	if (context.state.questionNumber.length > 1) {
		await context.setState({ agendaId: context.state.questionNumber.slice(1) }); // set which agenda (comes from the broadcast)
		await context.setState({ questionNumber: context.state.questionNumber.slice(0, 1) });
	}

	// if it's the first or second question, reset all the values
	if (context.state.questionNumber === '2' || context.state.questionNumber === '1') { // === '1' can only happen through the text test, not from the broadcast
		await context.setState({ seqAnswers: { foiConselho: null, gostou: null, costumaIr: null }, seqInput: '' }); // resetting values
	}
	const aux = context.state.seqAnswers; // for each questionNumber reached, we store which option was chosen by the user
	if (context.state.questionNumber === '2') { aux.foiConselho = true; } // Foi ao conselho - sim
	if (context.state.questionNumber === '5') { aux.foiConselho = false; } // não
	if (context.state.questionNumber === '3') { aux.gostou = true; } // gostou - sim
	if (context.state.questionNumber === '4') { aux.gostou = false; } // não
	if (context.state.questionNumber === '6') { aux.costumaIr = true; } // Costuma ir - sim
	if (context.state.questionNumber === '7') { aux.costumaIr = false; } // não
	await context.setState({ seqAnswers: aux });
};

module.exports.addConselhoLabel = async (context, postRecipientLabel, getRecipient, deleteRecipientLabel, newLabel) => {
	const user = await getRecipient(context.state.politicianData.user_id, context.session.user.id);
	// check if user has any labels and if one of those labels is "conselho"
	if (user && user.extra_fields && user.extra_fields.labels && user.extra_fields.labels.length > 0) {
		const oldConselho = await user.extra_fields.labels.find(e => e.name.slice(0, 3) === 'ccs'); // search for a label that starts with 'ccs'

		if (oldConselho && oldConselho.name && oldConselho.name.length > 0) { // check if we have the ccs label
			await deleteRecipientLabel(context.state.politicianData.user_id, context.session.user.id, oldConselho.name); // delete old ccs label
		}
	}

	await postRecipientLabel(context.state.politicianData.user_id, context.session.user.id, newLabel); // create new ccs label
};

module.exports.linkUserToCustomLabel = linkUserToCustomLabel;
module.exports.getBroadcastMetrics = postback.getBroadcastMetrics;
module.exports.dissociateLabelsFromUser = postback.dissociateLabelsFromUser;
module.exports.getBroadcastMetrics = postback.getBroadcastMetrics;
module.exports.addUserToBlackList = postback.addUserToBlackList;
module.exports.removeUserFromBlackList = postback.removeUserFromBlackList;
module.exports.checkUserOnLabel = postback.checkUserOnLabel;
module.exports.getLabelID = postback.getLabelID;
module.exports.formatDialogFlow = formatDialogFlow;
module.exports.apiai = dialogFlow(process.env.DIALOGFLOW_TOKEN);
module.exports.restartList = ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'ooi', 'comecar', 'começar', 'start', 'iniciar conversa', 'iniciar'];
