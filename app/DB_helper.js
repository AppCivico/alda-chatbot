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
	return result;
}

module.exports.getCCS = getCCS;

async function getDiretoria(CCS_ID) {
	// let currentDate = (new Date(Date.now())).toISOString().split('T')[0].split('-');
	// currentDate = new Date(currentDate[0], currentDate[1] - 1, currentDate[2]);

	const result = await sequelize.query(`
	SELECT nome, cargo, fim_gestao
	FROM diretoria
	WHERE id_ccs_cod_ccs = ${CCS_ID}
	ORDER BY inicio_gestao DESC, nome
	LIMIT 10
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Loaded Diretoria from ${CCS_ID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getDiretoria => ', err);
	});
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
		console.log(`Loaded calendario from ${CCS_ID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getCalendario => ', err);
	});
	return result;
}

module.exports.getCalendario = getCalendario;

async function getAssuntos(CCS_ID) {
	const result = await sequelize.query(`
	SELECT assunto
	FROM assunto_ata
	WHERE id_ccs_cod_ccs = ${CCS_ID}
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		const assuntos = [];
		results.forEach((element) => {
			assuntos.push(element.assunto.toLowerCase());
		});
		console.log(`Loaded assuntos from ${CCS_ID} successfully!`);
		return assuntos;
	}).catch((err) => {
		console.error('Error on getAssuntos => ', err);
	});
	return result;
}

module.exports.getAssuntos = getAssuntos;

async function addNotActive(UserID, CCS_COD) { // adds a future notification if the user searched for a not-active ccs
	await sequelize.query(`
	INSERT INTO notificar_ativacao(user_id, ccs_cod)
	VALUES (${UserID}, ${CCS_COD})
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${UserID} and ${CCS_COD} successfully!`);
	}).catch((err) => {
		console.error('Error on addNotActive => ', err);
	});
}

module.exports.addNotActive = addNotActive;
