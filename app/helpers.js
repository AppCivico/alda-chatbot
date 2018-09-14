const util = require('util');

module.exports.urlExists = util.promisify(require('url-exists'));

module.exports.formatDate = function formatDate(moment, date) {
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

// function findCCS(CCSList, place) {
// 	const result = CCSList.find(obj => (obj.bairro.includes(place)));

// 	if (result) {
// 		result.neighborhoods = [];
// 		CCSList.forEach((element) => {
// 			if (element.cod_ccs === result.cod_ccs) {
// 				result.neighborhoods.push(element.bairro);
// 			}
// 		});
// 		return result;
// 	}
// 	return undefined;
// }

// module.exports.findCCS = findCCS;

// TODO turn this and the next function to be the same function
// function findCCSMunicipio(CCSList, municipio) {
// 	const sameMunicipio = [];

// 	CCSList.forEach((element) => { // get every ccs on the same municipio (we say municipio but we are actually using regiao)
// 		if (element.regiao.toLowerCase().includes(municipio.trim().toLowerCase())) {
// 			sameMunicipio.push(element);
// 		}
// 	});

// 	if (sameMunicipio.length > 0) {
// 		return sameMunicipio;
// 	}
// 	return undefined;
// }

// module.exports.findCCSMunicipio = findCCSMunicipio;
// function findBairrosByCod(CCSList, cod) { // find other bairros that are also served by this CCS using the ccs_cod
// 	const bairros = [];

// 	for (const element of CCSList) { // eslint-disable-line
// 		if (element.cod_ccs === cod) { // if their code is the same, this bairro is on the same CCS
// 			bairros.push(element.bairro);
// 		}
// 	}
// 	return bairros;
// }

// module.exports.findBairrosByCod = findBairrosByCod;
