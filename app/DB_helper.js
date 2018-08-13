const { sequelize } = require('./server/index.js');

// sequelize
// 	.authenticate()
// 	.then(() => {
// 		console.log('Connection has been established successfully.');
// 	})
// 	.catch((err) => {
// 		console.error('Unable to connect to the database:', err);
// 	});

module.exports.sequelize = sequelize;

async function getCCS() {
	const result = await sequelize.query(`
    SELECT CCS.ccs, CCS.cod_ccs, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro
	FROM id_ccs CCS
	INNER JOIN ccs_aisp_risp LOCATION ON CCS.cod_ccs = LOCATION.id_ccs_cod_ccs
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log('Loaded CCS successfully!');
		// console.log(metadata);
		// console.log(results);
		results.forEach((element) => {
			if (element.bairro === null) {
				element.bairro = element.municipio; // eslint-disable-line no-param-reassign
			}
		});
		return results;
	}).catch((err) => {
		console.error('Error on getCCS => ', err);
	});
	// console.log(result);

	return result;
}

module.exports.getCCS = getCCS;

