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
		// console.log(metadata);
		// console.log(results);
		results.forEach((element) => {
			if (element.bairro === null) {
				element.bairro = element.municipio; // eslint-disable-line no-param-reassign
			}
		});
		console.log('Loaded CCS successfully!');
		return results;
	}).catch((err) => {
		console.error('Error on getCCS => ', err);
	});
	// console.log(result);
	return result;
}

module.exports.getCCS = getCCS;

async function getDiretoria(CCS_ID) {
	let currentDate = (new Date(Date.now())).toISOString().split('T')[0].split('-');
	currentDate = new Date(currentDate[0], currentDate[1] - 1, currentDate[2]);
	console.log(currentDate);
	console.log(typeof currentDate);
	console.log('\n\n\n\n');

	const result = await sequelize.query(`
	SELECT nome, cargo
	FROM diretoria
	WHERE id_ccs_cod_ccs = ${CCS_ID}
	ORDER BY inicio_gestao
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		// console.log(metadata);
		// console.log(results);
		console.log(`Loaded Diretoria ${CCS_ID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getDiretoria => ', err);
	});
	console.log(result);
	return result;
}

module.exports.getDiretoria = getDiretoria;

// SELECT nome, cargo
// FROM diretoria
// WHERE id_ccs_cod_ccs = ${ CCS_ID } AND
// fim_gestao >= ${currentDate}::date
// ORDER BY inicio_gestao
