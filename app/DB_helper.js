const { sequelize } = require('./server/index.js');

sequelize
	.authenticate()
	.then(() => {
		console.log('Connection has been established successfully.');
	})
	.catch((err) => {
		console.error('Unable to connect to the database:', err);
	});

module.exports.sequelize = sequelize;

module.exports.getCCS = async function getCCS() {
	const result = await sequelize.query(`
    SELECT CCS.ccs, CCS.cod_ccs, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro
	FROM conselhos CCS
	INNER JOIN abrangencias LOCATION ON CCS.cod_ccs = LOCATION.conselho_id;
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
};

// get every ccs on the same municipio (we say municipio but we are actually using regiao)
module.exports.getCCSsFromMunicipio = async function getCCSsFromMunicipio(Municipio) {
	const result = await sequelize.query(`
    SELECT CCS.ccs, CCS.cod_ccs, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro
	FROM conselhos CCS
	INNER JOIN abrangencias LOCATION ON CCS.cod_ccs = LOCATION.conselho_id
	WHERE LOWER(LOCATION.regiao) = '${Municipio}'
	ORDER BY CCS.cod_ccs;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		results.forEach((element) => {
			if (element.bairro === null) {
				element.bairro = element.municipio; // eslint-disable-line no-param-reassign
			}
		});
		console.log(`Got CCS on ${Municipio} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getCCSsFromMunicipio => ', err);
	});
	return result;
};

// get ccs using bairro
module.exports.getCCSsFromBairro = async function getCCSsFromBairro(Bairro) {
	const result = await sequelize.query(`
    SELECT CCS.ccs, CCS.cod_ccs, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro
	FROM conselhos CCS
	INNER JOIN abrangencias LOCATION ON CCS.cod_ccs = LOCATION.conselho_id
	WHERE LOWER(LOCATION.regiao) = '${Bairro} OR LOWER(LOCATION.bairro) = '${Bairro}'
	ORDER BY CCS.cod_ccs;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		results.forEach((element) => {
			if (element.bairro === null) {
				element.bairro = element.municipio; // eslint-disable-line no-param-reassign
			}
		});
		console.log(`Got CCS on ${Bairro} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getCCSsFromMunicipio => ', err);
	});
	return result;
};

// get every bairro on the same CCS
module.exports.getEveryBairro = async function getEveryBairro(CCS_ID) {
	const result = await sequelize.query(`
	SELECT bairro, municipio
	FROM abrangencias
	WHERE conselho_id = ${CCS_ID};
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		const bairros = [];
		results.forEach((element) => { // building an array of bairros
			if (element.bairro === null) {
				bairros.push(element.municipio);
			} else {
				bairros.push(element.bairro);
			}
		});
		console.log(`Loaded bairros from ${CCS_ID} successfully!`);
		return bairros;
	}).catch((err) => {
		console.error('Error on getEveryBairro => ', err);
	});
	return result;
};

module.exports.getNamefromCCS = async function getNamefromCCS(CCS_ID) {
	const result = await sequelize.query(`
	SELECT ccs
	FROM conselhos
	WHERE cod_ccs = ${CCS_ID}
	LIMIT 1;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got name from ${CCS_ID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getDiretoria => ', err);
	});
	return result[0].ccs;
};

module.exports.getDiretoria = async function getDiretoria(CCS_ID) {
	const result = await sequelize.query(`
	SELECT nome, cargo, fim_gestao
	FROM diretoria
	WHERE id_ccs_cod_ccs = ${CCS_ID}
	ORDER BY inicio_gestao DESC, nome
	LIMIT 10;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Loaded Diretoria from ${CCS_ID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getDiretoria => ', err);
	});
	return result;
};

module.exports.getCalendario = async function getCalendario(CCS_ID) {
	const result = await sequelize.query(`
	SELECT data_hora, endereco
	FROM agenda
	WHERE id_ccs_cod_ccs = ${CCS_ID}
	ORDER BY data_hora DESC;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Loaded calendario from ${CCS_ID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getCalendario => ', err);
	});
	return result;
};

module.exports.getAssuntos = async function getAssuntos(CCS_ID) {
	const result = await sequelize.query(`
	SELECT assunto
	FROM assunto_ata
	WHERE id_ccs_cod_ccs = ${CCS_ID};
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
};

// notificar_ativacao -------------------------------------------------------------------------------

// check if notification_ativacao with UserID, CCS_ID exists already
module.exports.checkNotificationAtivacao = async function checkNotificationAtivacao(UserID, CCS_ID) {
	const result = await sequelize.query(`
	SELECT EXISTS(SELECT 1 FROM notificar_ativacao WHERE user_id=${UserID} AND ccs_cod=${CCS_ID})
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Checked if ${UserID} and ${CCS_ID} exists successfully! => ${results[0].exists}`);
		return results;
	}).catch((err) => {
		console.error('Error on checkNotificationAtivacao => ', err);
	});
	return result[0].exists;
};

// adds a future notification if the user searched for a not-active ccs
module.exports.addNotActive = async function addNotActive(UserID, CCS_COD) {
	await sequelize.query(`
	INSERT INTO notificar_ativacao(user_id, ccs_cod)
	VALUES (${UserID}, ${CCS_COD});
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${UserID} and ${CCS_COD} successfully!`);
	}).catch((err) => {
		console.error('Error on addNotActive => ', err);
	});
};

// get every notification that wasn't already sent but only if the status of the ccs is now 'Ativo'
module.exports.getActivatedNotification = async function getActivatedNotification() {
	const result = await sequelize.query(`
	SELECT NOTIFICATION.id, NOTIFICATION.user_id, NOTIFICATION.ccs_cod, CCS.cod_ccs, CCS.status
	FROM notificar_ativacao AS NOTIFICATION
	INNER JOIN conselhos CCS ON NOTIFICATION.ccs_cod = CCS.cod_ccs
	WHERE NOT NOTIFICATION.notificado and CCS.status = 'Ativo'
	ORDER BY NOTIFICATION.ccs_cod;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log('Loaded notifications successfully!');
		return results;
	}).catch((err) => {
		console.error('Error on getActivatedNotification => ', err);
	});
	return result;
};

// updates value of notificado from PK
module.exports.updateNotification = async function updateNotification(PK) {
	await sequelize.query(`
	UPDATE notificar_ativacao
	SET notificado = TRUE
	WHERE id = ${PK};
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Updated row ${PK} successfully!`);
	}).catch((err) => {
		console.error('Error on updateNotification => ', err);
	});
};

// notificar_agenda -------------------------------------------------------------------------------

// check if notification_agenda with UserID, CCS_ID exists already
module.exports.checkNotificationAgenda = async function checkNotificationAgenda(UserID, CCS_ID) {
	const result = await sequelize.query(`
	SELECT EXISTS(SELECT 1 FROM notificar_agenda WHERE user_id=${UserID} AND ccs_cod=${CCS_ID})
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Checked if ${UserID} and ${CCS_ID} exists successfully! => ${results[0].exists}`);
		return results;
	}).catch((err) => {
		console.error('Error on checkNotificationAgenda => ', err);
	});
	return result[0].exists;
};

// adds a future notification_agenda if the user searched the agenda for that ccs
module.exports.addAgenda = async function addNotActive(UserID, CCS_COD, DataHora) {
	await sequelize.query(`
	INSERT INTO notificar_agenda(user_id, ccs_cod, data_hora)
	VALUES ('${UserID}', '${CCS_COD}', '${DataHora}');
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${UserID} and ${CCS_COD} successfully!`);
	}).catch((err) => {
		console.error('Error on addNotActive => ', err);
	});
};

/*
	CREATE TABLE notificar_ativacao(
	ID SERIAL PRIMARY KEY,
	user_id        BIGINT  NOT NULL,
	ccs_cod        INT     NOT NULL,
	notificado     BOOLEAN NOT NULL DEFAULT FALSE
);
*/

/*
	CREATE TABLE notificar_agenda(
	ID SERIAL PRIMARY KEY,
	user_id        BIGINT  NOT NULL,
	ccs_cod        INT     NOT NULL,
	data_hora	   TIMESTAMP WITHOUT TIME ZONE,
	notificado     BOOLEAN NOT NULL DEFAULT FALSE
);
*/
