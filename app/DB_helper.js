const { sequelize } = require('./server/index.js');
const { moment } = require('./helpers');

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
    SELECT CCS.ccs, CCS.id, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro
	FROM conselhos CCS
	INNER JOIN abrangencias LOCATION ON CCS.id = LOCATION.conselho_id;
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
    SELECT CCS.ccs, CCS.id, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro
	FROM conselhos CCS
	INNER JOIN abrangencias LOCATION ON CCS.id = LOCATION.conselho_id
	WHERE UNACCENT(LOWER(LOCATION.regiao)) LIKE '%' || '${Municipio}' || '%'
	ORDER BY CCS.id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		results.forEach((element) => {
			if (element.bairro === null) {
				element.bairro = element.municipio; // eslint-disable-line no-param-reassign
			}
		});
		console.log(`Got CCS on municipio ${Municipio} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getCCSsFromMunicipio => ', err);
	});
	return result;
};

// get ccs using bairro
module.exports.getCCSsFromBairro = async function getCCSsFromBairro(Bairro) {
	const result = await sequelize.query(`
    SELECT CCS.ccs, CCS.id, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro
	FROM conselhos CCS
	INNER JOIN abrangencias LOCATION ON CCS.id = LOCATION.conselho_id
	WHERE LOWER(LOCATION.regiao) = '${Bairro}' OR LOWER(LOCATION.bairro) = '${Bairro}'
	ORDER BY CCS.id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		results.forEach((element) => {
			if (element.bairro === null) {
				element.bairro = element.municipio; // eslint-disable-line no-param-reassign
			}
		});
		console.log(`Got CCS on bairro ${Bairro} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getCCSsFromBairro => ', err);
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
	WHERE id = ${CCS_ID}
	LIMIT 1;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Got name from ${CCS_ID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getNamefromCCS => ', err);
	});
	return result[0].ccs;
};

module.exports.getDiretoria = async function getDiretoria(CCS_ID) {
	const result = await sequelize.query(`
	SELECT nome, cargo, fim_gestao
	FROM diretorias
	WHERE conselho_id = ${CCS_ID}
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


async function getAgenda(CCS_ID) { // also known as calendário
	const result = await sequelize.query(`
	SELECT id, data, hora, endereco, bairro, ponto_referencia, updated_at
	FROM agendas
	WHERE conselho_id = ${CCS_ID}
	ORDER BY data_hora DESC
	LIMIT 1;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Loaded agendas from ${CCS_ID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getAgenda => ', err);
	});

	if (result.length === 0) {
		return undefined;
	}
	return result[0];
}
module.exports.getAgenda = getAgenda;

module.exports.getAssuntos = async function getAssuntos(CCS_ID) {
	const result = await sequelize.query(`
	SELECT DISTINCT assunto
	FROM assuntos
	WHERE conselho_id = ${CCS_ID} AND ano = 2017;
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

async function getResults(conselhoID) {
	const result = await sequelize.query(`
	SELECT RESULTADO.texto, RESULTADO.link_download, RESULTADO.agenda_id, AGENDAS.id, AGENDAS.data
	FROM resultados RESULTADO
	INNER JOIN agendas AGENDAS ON RESULTADO.agenda_id = AGENDAS.id
	WHERE AGENDAS.conselho_id = '${conselhoID}'
	ORDER BY AGENDAS.updated_at DESC
	LIMIT 1;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Loaded last resultados from ${conselhoID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getResults => ', err);
	});

	if (result.length === 0) {
		return undefined;
	}
	return result[0];
}

module.exports.getResults = getResults;

// notificar_ativacao -------------------------------------------------------------------------------

// check if notification_ativacao with UserID, CCS_ID exists already
module.exports.checkNotificationAtivacao = async function checkNotificationAtivacao(UserID, CCS_ID) {
	const result = await sequelize.query(`
	SELECT EXISTS(SELECT 1 FROM notificar_ativacao WHERE user_id = ${UserID} AND conselho_id = ${CCS_ID})
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Checked if ${UserID} and ${CCS_ID} exists successfully! => ${results[0].exists}`);
		return results;
	}).catch((err) => {
		console.error('Error on checkNotificationAtivacao => ', err);
	});
	return result[0].exists;
};

// adds a future notification if the user searched for a not-active ccs
async function addNotActive(UserID, CCS_COD) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	INSERT INTO notificar_ativacao(user_id, conselho_id, created_at, updated_at)
	VALUES (${UserID}, ${CCS_COD}, '${date}', '${date}');
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${UserID} and ${CCS_COD} successfully!`);
	}).catch((err) => {
		console.error('Error on addNotActive => ', err);
	});
}
module.exports.addNotActive = addNotActive;
// addNotActive('1864330513659814', 1017); // to test: change status of ccs_1017 to ativo and then back to inativo

// get every notification that wasn't already sent but only if the status of the ccs is now 'Ativo'
module.exports.getActivatedNotification = async function getActivatedNotification() {
	const result = await sequelize.query(`
	SELECT NOTIFICATION.id, NOTIFICATION.user_id, NOTIFICATION.conselho_id, CCS.id, CCS.status
	FROM notificar_ativacao AS NOTIFICATION
	INNER JOIN conselhos CCS ON NOTIFICATION.conselho_id = CCS.id
	WHERE NOT NOTIFICATION.notificado and CCS.status = 'Ativo'
	ORDER BY NOTIFICATION.conselho_id;
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
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	UPDATE notificar_ativacao
	SET notificado = TRUE, updated_at = '${date}'
	WHERE conselho_id = ${PK};
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Updated row ${PK} successfully!`);
	}).catch((err) => {
		console.error('Error on updateNotification => ', err);
	});
};

// notificar_agenda -------------------------------------------------------------------------------

// check if notification_agenda with UserID, CCS_ID exists already
module.exports.checkNotificationAgenda = async function checkNotificationAgenda(UserID, agendaID) {
	const result = await sequelize.query(`
	SELECT EXISTS(SELECT 1 FROM notificar_agenda WHERE user_id = ${UserID} AND agendas_id = ${agendaID})
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Checked if ${UserID} and ${agendaID} exists successfully! => ${results[0].exists}`);
		return results;
	}).catch((err) => {
		console.error('Error on checkNotificationAgenda => ', err);
	});
	return result[0].exists;
};

// adds a future notification_agenda if the user searched the agenda for that ccs
async function addAgenda(UserID, agendaID, endereco, dataHora) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	INSERT INTO notificar_agenda(user_id, agendas_id, notificado, endereco, data_hora, created_at, updated_at)
	VALUES ('${UserID}', '${agendaID}', FALSE, '${endereco}', '${dataHora}', '${date}', '${date}');
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${UserID} and ${agendaID} successfully!`);
	}).catch((err) => {
		console.error('Error on addAgenda => ', err);
	});
}
module.exports.addAgenda = addAgenda;
// addAgenda('1864330513659814', '1', 'Na rua tal e tal', '2018-04-10 00:00:00'); // test

// get every notification that wasn't already sent (including when the agendas.status_id is 1 or 4)
module.exports.getAgendaNotification = async function getActivatedNotification() {
	const result = await sequelize.query(`
	SELECT NOTIFICATION.id, NOTIFICATION.user_id, NOTIFICATION.agendas_id, NOTIFICATION.endereco as old_endereco, NOTIFICATION.data_hora as old_datahora, 
	AGENDAS.conselho_id, AGENDAS.status_id, AGENDAS.data, AGENDAS.hora, AGENDAS.bairro, AGENDAS.endereco, AGENDAS.ponto_referencia, CONSELHOS.ccs
	FROM notificar_agenda AS NOTIFICATION
	INNER JOIN agendas AGENDAS ON NOTIFICATION.agendas_id = AGENDAS.id
	inner join conselhos CONSELHOS on AGENDAS.conselho_id = CONSELHOS.id
	WHERE NOT NOTIFICATION.notificado
	ORDER BY AGENDAS.status_id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log('Loaded notifications successfully!');
		return results;
	}).catch((err) => {
		console.error('Error on getAgendaNotification => ', err);
	});
	return result;
};

// updates value of notificado from PK
module.exports.updateAgendaNotification = async function updateAgendaNotification(PK, boolean) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	UPDATE notificar_agenda
	SET notificado = ${boolean}, updated_at = '${date}'
	WHERE id = ${PK};
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Updated updateAgendaNotification on ${PK} successfully!`);
	}).catch((err) => {
		console.error('Error on updateAgendaNotification => ', err);
	});
};

// broadcast -------------------------------------------------------------------------------

// get every open agenda to warn with a broadcast
module.exports.getAgendaNotificationFromID = async function getAgendaNotificationFromID(PK) {
	const result = await sequelize.query(`
	SELECT user_id, data_hora, agendas_id, endereco, updated_at
	FROM notificar_agenda
	WHERE agendas_id = ${PK} AND NOT notificado;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`getAgendaNotificationFromID from ${PK} was successful!`);
		return results;
	}).catch((err) => {
		console.error('Error on getAgendaNotificationFromID => ', err);
	});

	return result;
};

/* creating unaccent dictionary funcion
	user=> CREATE EXTENSION unaccent;
	CREATE EXTENSION
	user=> select unaccent('Cajú');
	unaccent
	----------
	Caju
	(1 row)

*/
/*
	CREATE TABLE notificar_ativacao(
	ID SERIAL PRIMARY KEY,
	user_id BIGINT  NOT NULL,
	conselho_id INT     NOT NULL,
	notificado BOOLEAN NOT NULL DEFAULT FALSE,
	created_at timestamp without time zone NOT NULL,
  	updated_at timestamp without time zone NOT NULL
	);
*/

/*
	CREATE TABLE notificar_agenda (
	id SERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL,
	notificado BOOLEAN NOT NULL DEFAULT FALSE,
	agendas_id integer NOT NULL,
    endereco text NOT NULL,
    data_hora timestamp without time zone NOT NULL,
	created_at timestamp without time zone NOT NULL,
	updated_at timestamp without time zone NOT NULL
	);
*/

/*
	Agenda Status map:
	1 -> reunion was canceled
	2 -> reunion was canceled and then changed
	3 -> reunion was changed
	4 -> reunion scheduled
*/

/*
		Cada vez que um usuário vê o calendário/agenda do seu CCS, ele entra para a tabela notificar_agenda que guarda, além da agenda e do usuário em questão,
		o endereço e a data da agenda no momento em que o usuário a consultou e se o aviso em questão já foi enviado(ou se ele precisa ser enviado ainda).
		Existe um timer/crontab rodando de duas em duas horas, das 8h às 22h, de seg a sex que avisa aos usuários se houve alguma alteração no estado da agenda.
		Temos 4 estados: 1 -> reunião cancelada; 2 -> reunião cancelada e modificada; 3 -> reunião modificada; 4 -> reunião marcada (normal).
		Quando o timer inicia seu processo ele verifica se a data da reunião já passou. Se sim, não tem mais porque enviar essa notificação.
		Se não, ele verifica o estado da agenda para mandar a mensagem adequada. Se a reunião foi cancelada (estado 1), uma nova notificação é adicionada a tabela,
		para avisar caso ele seja remarcada (estado 2).
		Da mesma forma, uma tag 'agenda<id_do_ccs>' é adicionada a cada usuário que visualize a agenda. Essa tag é removida somente quando a data da agenda já passou,
		as notificações que são enviadas pelo timer não removem essa tag. No menu de administrador, se o admin clicar em "Avisar Agenda", será possível avisar
		a quem possui essa tag que houve um cancelamento/mudança na reunião. Isso também não deleta a tag.
*/
