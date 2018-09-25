const util = require('util');
const moment = require('moment');
const postback = require('./postback');

moment.locale('pt-BR');

module.exports.moment = moment;

module.exports.urlExists = util.promisify(require('url-exists'));

module.exports.formatDate = function formatDate(date) {
	return `${moment(date).format('dddd')}, ${moment(date).format('D')} de ${moment(date).format('MMMM')} às ${moment(date).format('hh:mm')}`;
};

module.exports.findCCSBairro = function findCCSBairro(sameMunicipio, bairro) {
	const theBairros = [];

	sameMunicipio.forEach((element) => {
		if (element.bairro.toLowerCase() === (bairro.trim().toLowerCase())) {
			theBairros.push(element);
		}
	});

	if (theBairros.length > 0) {
		return theBairros;
	}
	return undefined;
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

module.exports.getNeighborhood = function getNeighborhood(results) {
	let neighborhood = results.find(x => x.types.includes('political'));
	if (!neighborhood) { neighborhood = results.find(x => x.types.includes('sublocality')); }
	if (!neighborhood) { neighborhood = results.find(x => x.types.includes('sublocality_level_1')); }
	return neighborhood;
};

module.exports.listBairros = function listBairros(ccs) {
	let bairros = [];

	ccs.forEach((element) => {
		bairros.push(element.bairro);
	});
	bairros = getRandom(bairros, 5);
	return [...new Set(bairros)]; // set stores only unique values
};


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
