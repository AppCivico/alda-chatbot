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
    SELECT CCS.ccs, CCS.cod_ccs, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro
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
	SELECT nome, cargo, fim_gestao
	FROM diretoria
	WHERE id_ccs_cod_ccs = ${CCS_ID}
	ORDER BY inicio_gestao DESC, nome
	LIMIT 10
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

async function getCalendario(CCS_ID) {
	const result = await sequelize.query(`
	SELECT data_hora, endereco
	FROM agenda
	WHERE id_ccs_cod_ccs = ${CCS_ID}
	ORDER BY data_hora DESC
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		// console.log(metadata);
		// console.log(results);
		console.log(`Loaded calendario ${CCS_ID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getCalendario => ', err);
	});
	// console.log(result);
	return result;
}

module.exports.getCalendario = getCalendario;

async function getAssuntos(CCS_ID) {
	const result = await sequelize.query(`
	SELECT assunto
	FROM assunto_ata
	WHERE id_ccs_cod_ccs = ${CCS_ID}
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		// console.log(metadata);
		// console.log(results);
		const assuntos = [];
		results.forEach((element) => {
			assuntos.push(element.assunto.toLowerCase());
		});
		console.log(`Loaded assuntos ${CCS_ID} successfully!`);
		return assuntos;
	}).catch((err) => {
		console.error('Error on getAssuntos => ', err);
	});
	console.log(result);
	return result;
}

module.exports.getAssuntos = getAssuntos;
