const { sequelize } = require('./server/index.js');
const { moment } = require('./helpers');

if (process.env.TEST !== 'true') {
	sequelize
		.authenticate()
		.then(() => {
			console.log('Connection has been established successfully.');
		})
		.catch((err) => {
			console.error('Unable to connect to the database:', err);
		});
}
module.exports.sequelize = sequelize;

// module.exports.getCCS = async function getCCS() { // unused
// 	const result = await sequelize.query(`
//     SELECT CCS.ccs, CCS.id, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro
// 	FROM conselhos CCS
// 	INNER JOIN abrangencias LOCATION ON CCS.id = LOCATION.conselho_id;
// 	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
// 		results.forEach((element) => {
// 			if (element.bairro === null) {
// 				element.bairro = element.municipio; // eslint-disable-line no-param-reassign
// 			}
// 		});
// 		console.log('Loaded CCS successfully!');
// 		return results;
// 	}).catch((err) => {
// 		console.error('Error on getCCS => ', err);
// 	});
// 	return result;
// };

// get every ccs on the same municipio (we say municipio but we are actually using regiao)
async function getCCSsFromMunicipio(Municipio) {
	let indexRemove;
	let result = await sequelize.query(`
	SELECT CCS.ccs, CCS.id, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro, LOCATION.regiao_novo, LOCATION.meta_regiao, LOCATION.id as abrangencia_id
	FROM conselhos CCS
	INNER JOIN abrangencias LOCATION ON CCS.id = LOCATION.conselho_id
	WHERE UNACCENT(LOWER(LOCATION.municipio)) LIKE '%' || '${Municipio}' || '%'
	ORDER BY CCS.id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		results.forEach((element, index) => {
			if (element.bairro === null) { // replace empty bairro or municipio
				// element.bairro = element.municipio; // eslint-disable-line no-param-reassign
				if (element.regiao === 'Capital') { // remove that one empty bairro/municipio on Capital
					indexRemove = index; // get the index of said empty entry to remove it later
				}
			}
		});
		console.log(`Got CCS on municipio ${Municipio} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getCCSsFromMunicipio => ', err);
	});
	if (indexRemove) { await result.splice(indexRemove, 1); } // removing that empty bairro
	// filtering out entries with repeated municipio and id, except on municipio rio de janeiro because of colegio and centro
	if (result && result[0] && result[0].municipio.toLowerCase() !== 'rio de janeiro') {
		result = result.filter((thing, index, self) => self.findIndex(t => t.municipio === thing.municipio && t.id === thing.id) === index);
	}

	return result;
}
module.exports.getCCSsFromMunicipio = getCCSsFromMunicipio;

// get ccs using bairro
async function getCCSsFromBairro(Bairro) {
	let result = await sequelize.query(`
    SELECT CCS.ccs, CCS.id, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro, LOCATION.regiao_novo, LOCATION.meta_regiao, LOCATION.id as abrangencia_id
	FROM conselhos CCS
	INNER JOIN abrangencias LOCATION ON CCS.id = LOCATION.conselho_id
	WHERE UNACCENT(LOWER(LOCATION.regiao)) LIKE '%' || '${Bairro}' || '%' OR UNACCENT(LOWER(LOCATION.bairro)) LIKE '%' || '${Bairro}' || '%'
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

	if (result) {
		result = result.filter((thing, index, self) => self.findIndex(t => t.bairro === thing.bairro && t.id === thing.id) === index);
	}

	return result;
}
module.exports.getCCSsFromBairro = getCCSsFromBairro;
// get ccs using bairro
async function getCCSsFromBairroExact(Bairro) {
	let result = await sequelize.query(`
    SELECT CCS.ccs, CCS.id, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro, LOCATION.regiao_novo, LOCATION.meta_regiao, LOCATION.id as abrangencia_id
	FROM conselhos CCS
	INNER JOIN abrangencias LOCATION ON CCS.id = LOCATION.conselho_id
	WHERE UNACCENT(LOWER(LOCATION.bairro)) = '${Bairro}'
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

	if (result) {
		result = result.filter((thing, index, self) => self.findIndex(t => t.bairro === thing.bairro && t.id === thing.id) === index);
	}

	return result;
}
module.exports.getCCSsFromBairroExact = getCCSsFromBairroExact;

async function getCCSsFromID(CCSID) {
	const result = await sequelize.query(`
    SELECT CCS.ccs, CCS.id, CCS.status, LOCATION.regiao, LOCATION.municipio, LOCATION.bairro, LOCATION.regiao_novo, LOCATION.meta_regiao, LOCATION.id as abrangencia_id
	FROM conselhos CCS
	INNER JOIN abrangencias LOCATION ON CCS.id = LOCATION.conselho_id
	WHERE CCS.id = '${CCSID}'
	ORDER BY CCS.id;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		results.forEach((element) => {
			if (element.bairro === null) {
				element.bairro = element.municipio; // eslint-disable-line no-param-reassign
			}
		});
		console.log(`Got CCS ${CCSID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getCCSsFromBairro => ', err);
	});

	if (result) {
		// result = result.filter((thing, index, self) => self.findIndex(t => t.bairro === thing.bairro && t.id === thing.id) === index);
		if (CCSID === 1043) { // check if it's paquetá (island) to change the bairro we will show the user
			result[0].bairro = 'Paquetá';
		}
	}
	return result[0];
}
module.exports.getCCSsFromID = getCCSsFromID;

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

async function getDiretoria(CCS_ID) {
	const result = await sequelize.query(`
	SELECT nome, cargo, fim_gestao
	FROM diretorias
	WHERE conselho_id = ${CCS_ID} AND cargo IN ('Presidente (a)', 'Vice-Presidente (a)', 'Diretor de Assuntos Sociais e Comunitários', 
	'1° Secretário (a)', '2° Secretário (a)', 'Comissão De Ética 1', 'Comissão De Ética 2', 'Comissão De Ética 3')
ORDER BY
   CASE cargo
      WHEN 'Presidente (a)' THEN 1
      WHEN 'Vice-Presidente (a)' THEN 2
      WHEN '1° Secretário (a)' THEN 3
      WHEN '2° Secretário (a)' THEN 4
	  WHEN 'Diretor de Assuntos Sociais e Comunitários' THEN 5
	  WHEN 'Comissão De Ética 1' THEN 6
      WHEN 'Comissão De Ética 2' THEN 7
      WHEN 'Comissão De Ética 3' THEN 8
      ELSE 9
   END, id
   LIMIT 10;
   `).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Loaded Diretoria from ${CCS_ID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getDiretoria => ', err);
	});
	return result;
}
module.exports.getDiretoria = getDiretoria;

async function getMembrosNatosBairro(bairro, ccsID) {
	const result = await sequelize.query(`
  SELECT MEMBROS.cmd_bpm, MEMBROS.delegado
	FROM membros_natos MEMBROS
	INNER JOIN abrangencias LOCATION ON MEMBROS.id = LOCATION.membronato_id
	WHERE LOCATION.bairro = '${bairro}' AND LOCATION.conselho_id = '${ccsID}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Loaded membros natos from abrangencia ${bairro} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getMembrosNatosBairro => ', err);
	});

	return result;
}
module.exports.getMembrosNatosBairro = getMembrosNatosBairro;

async function getMembrosNatosMunicipio(bairro, ccsID) {
	const result = await sequelize.query(`
  SELECT MEMBROS.cmd_bpm, MEMBROS.delegado
	FROM membros_natos MEMBROS
	INNER JOIN abrangencias LOCATION ON MEMBROS.id = LOCATION.membronato_id
	WHERE LOCATION.municipio = '${bairro}' AND LOCATION.conselho_id = '${ccsID}';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Loaded membros natos from abrangencia ${bairro} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getMembrosNatosMunicipio => ', err);
	});

	return result;
}
module.exports.getMembrosNatosMunicipio = getMembrosNatosMunicipio;

// gets the next agenda from the CCS. This means the closest data after the present day.
async function getAgenda(CCS_ID) { // also known as calendário
	const result = await sequelize.query(`
	SELECT id, data, hora, endereco, bairro, ponto_referencia, updated_at
	FROM agendas
	WHERE conselho_id = '${CCS_ID}'
	ORDER BY data DESC, hora DESC
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

module.exports.getAssuntos = async (CCS_ID) => {
	// uses CCS_ID to get the newest agenda, with this agenda we get the subject_id that were discuted and with these is we get the text
	// Remember: closest agenda after today
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD');

	const result = await sequelize.query(`
	SELECT ASSUNTO.assunto
	FROM assuntos ASSUNTO
	WHERE ASSUNTO.id = ANY (
		SELECT AGENDA_ASSUNTO.assunto_id
		FROM assunto_agenda AGENDA_ASSUNTO
		WHERE AGENDA_ASSUNTO.agenda_id = (
			SELECT id FROM agendas AGENDA
			WHERE AGENDA.conselho_id = '${CCS_ID}' AND AGENDA.data > '${date}'
			ORDER BY AGENDA.data ASC, AGENDA.hora ASC
			limit 1));
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Loaded assuntos from ${CCS_ID} successfully!`);
		const assuntos = [];
		if (results && results.length > 0) {
			results.forEach((element) => {
				assuntos.push(element.assunto.toLowerCase());
			});
		}
		return assuntos;
	}).catch((err) => {
		console.error('Error on getAssuntos => ', err);
	});
	return result;
};

async function savePautaSugestao(UserID, CCS_ID, pauta) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');
	const agenda = await sequelize.query(`SELECT id from agendas WHERE conselho_id = '${CCS_ID}' ORDER BY data DESC NULLS LAST LIMIT 1;`);

	if (agenda && agenda[0] && agenda[0][0] && agenda[0][0].id) {
		await sequelize.query(`
		INSERT INTO pautas_sugeridas(user_id, agenda_id, sugestao, created_at, updated_at)
		VALUES (${UserID}, ${agenda[0][0].id}, '${pauta}', '${date}', '${date}');
		`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
			console.log(`Added ${UserID}'s suggestion on agenda ${agenda[0][0].id} successfully!`);
		}).catch((err) => {
			console.error('Error on savePautaSugestao => ', err);
		});
	}
}
module.exports.savePautaSugestao = savePautaSugestao;

async function getResults(CCS_ID) { // get most recent results from before the current day
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD');

	const result = await sequelize.query(`
	SELECT RESULTADO.texto, RESULTADO.link_download, RESULTADO.agenda_id, AGENDAS.id, AGENDAS.data, RESULTADO.id
	FROM resultados RESULTADO
	INNER JOIN agendas AGENDAS ON RESULTADO.agenda_id = AGENDAS.id
	WHERE AGENDAS.conselho_id = '${CCS_ID}' AND AGENDAS.data <= '${date}'
	ORDER BY AGENDAS.updated_at DESC
	LIMIT 1;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Loaded last resultados from ${CCS_ID} successfully!`);
		return results;
	}).catch((err) => {
		console.error('Error on getResults => ', err);
	});

	if (!result || result.length === 0) {
		return undefined;
	}
	return result[0];
}

module.exports.getResults = getResults;

async function getResultsAssuntos(resultsID) {
	const result = await sequelize.query(`
	SELECT ASSUNTO.assunto
	FROM assuntos ASSUNTO
	WHERE ASSUNTO.id = ANY (
		SELECT AGENDA_RESULTADO.assunto_id
		FROM assunto_resultado AGENDA_RESULTADO
		WHERE AGENDA_RESULTADO.resultado_id = '${resultsID}'
		);
		`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Loaded last assuntos dos resultados from ${resultsID} successfully!`);
		const assuntos = [];
		if (results && results.length > 0) {
			results.forEach((element) => {
				assuntos.push(element.assunto.toLowerCase());
			});
		}
		return assuntos;
	}).catch((err) => {
		console.error('Error on getResults => ', err);
	});
	console.log('Resultados');

	console.log(result);

	return result;
}

module.exports.getResultsAssuntos = getResultsAssuntos;

// notificar_ativacao -------------------------------------------------------------------------------

// check if notification_ativacao with UserID, CCS_ID exists already
module.exports.checkNotificationAtivacao = async (UserID, CCS_ID) => {
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
module.exports.getActivatedNotification = async () => {
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
module.exports.updateNotification = async (PK) => {
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
module.exports.checkNotificationAgenda = async (UserID, agendaID) => {
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
module.exports.getAgendaNotification = async () => {
	const result = await sequelize.query(`
	SELECT NOTIFICATION.id, NOTIFICATION.user_id, NOTIFICATION.agendas_id, NOTIFICATION.endereco as old_endereco, NOTIFICATION.data_hora as old_datahora, 
	AGENDAS.conselho_id, AGENDAS.status_id, AGENDAS.data, AGENDAS.hora, AGENDAS.bairro, AGENDAS.endereco, AGENDAS.ponto_referencia, CONSELHOS.ccs
	FROM notificar_agenda AS NOTIFICATION
	INNER JOIN agendas AGENDAS ON NOTIFICATION.agendas_id = AGENDAS.id
	INNER JOIN conselhos CONSELHOS on AGENDAS.conselho_id = CONSELHOS.id
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
module.exports.updateAgenda = async (PK, boolean) => {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	UPDATE notificar_agenda
	SET notificado = ${boolean}, updated_at = '${date}'
	WHERE id = ${PK};
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Updated updateNovaAgenda on ${PK} successfully!`);
	}).catch((err) => {
		console.error('Error on updateNovaAgenda => ', err);
	});
};

// notificar_nova_agenda -------------------------------------------------------------------------------
// check if notificar_nova_agenda with UserID, CCS_ID exists already
module.exports.checkNovaAgenda = async (UserID, agendaID) => {
	const result = await sequelize.query(`
	SELECT EXISTS(SELECT 1 FROM notificar_nova_agenda WHERE user_id = ${UserID} AND ultima_agenda = ${agendaID})
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Checked if ${UserID} and ${agendaID} exists successfully! => ${results[0].exists}`);
		return results;
	}).catch((err) => {
		console.error('Error on checkNovaAgenda => ', err);
	});
	return result[0].exists;
};

// adds a future notification_agenda if the user searched the agenda for that ccs
async function addNovaAgenda(UserID, agendaID) {
	let date = new Date();
	date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	INSERT INTO notificar_nova_agenda(user_id, ultima_agenda, notificado, created_at, updated_at)
	VALUES ('${UserID}', '${agendaID}', FALSE, '${date}', '${date}');
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Added ${UserID} and ${agendaID} successfully!`);
	}).catch((err) => {
		console.error('Error on addNovaAgenda => ', err);
	});
}
module.exports.addNovaAgenda = addNovaAgenda;

// get every notification that wasn't already sent (including when the agendas.status_id is 1 or 4)
module.exports.getNovaAgenda = async () => {
	const result = await sequelize.query(`
	SELECT NOTIFICATION.id, NOTIFICATION.user_id, NOTIFICATION.ultima_agenda, AGENDAS.conselho_id, CONSELHOS.ccs
	FROM notificar_nova_agenda AS NOTIFICATION
	INNER JOIN agendas AGENDAS ON NOTIFICATION.ultima_agenda = AGENDAS.id
	INNER JOIN conselhos CONSELHOS on AGENDAS.conselho_id = CONSELHOS.id
	WHERE NOT NOTIFICATION.notificado
	ORDER BY NOTIFICATION.ultima_agenda;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log('Loaded notifications successfully!');
		return results;
	}).catch((err) => {
		console.error('Error on getNovaAgenda => ', err);
	});
	return result;
};

// updates value of notificado from PK
module.exports.updateNovaAgenda = async (PK, boolean) => {
	let date = new Date(); date = await moment(date).format('YYYY-MM-DD HH:mm:ss');

	await sequelize.query(`
	UPDATE notificar_nova_agenda
	SET notificado = ${boolean}, updated_at = '${date}'
	WHERE id = ${PK};
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`Updated updateNovaAgenda on ${PK} successfully!`);
	}).catch((err) => {
		console.error('Error on updateNovaAgenda => ', err);
	});
};

// broadcast -------------------------------------------------------------------------------

// get every open agenda to warn with a broadcast
module.exports.getAgendaNotificationFromID = async (PK) => {
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

// sequencia --------------------------------------------------------------------------------
module.exports.saveSeqAnswer = async (UserID, agendaID, answers, input) => {
	let date = new Date(); date = await moment(date).format('YYYY-MM-DD HH:mm:ss');
	const result = await sequelize.query(`
	INSERT INTO enquete_participacao(user_id, agenda_id, foi_ao_conselho, gostou, constuma_ir, input, created_at, updated_at)
	VALUES ('${UserID}', '${agendaID}', ${answers.foiConselho},  ${answers.gostou},  ${answers.costumaIr}, NULLIF ('${input}', ''), '${date}', '${date}');
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log(`saveSeqAnswer from user ${UserID} and agenda ${agendaID} was successful!`);
		return results;
	}).catch((err) => {
		console.error('Error on getAgendaNotificationFromID => ', err);
	});

	return result;
};

async function getYesterdayAgenda() {
	// get ids and name rom users that are linked to one agenda that happened the day before
	const result = await sequelize.query(`
	SELECT AGENDA.agendas_id, AGENDA.user_id, USERS.user_name
	FROM notificar_agenda as AGENDA
	INNER JOIN chatbot_users USERS ON AGENDA.user_id = USERS.user_id
	WHERE AGENDA.data_hora > now() - interval '1 day';
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
		console.log('getYesterdayAgenda was successful!');
		return results;
	}).catch((err) => {
		console.error('Error on getYesterdayAgenda => ', err);
	});
	return result;
}

module.exports.getYesterdayAgenda = getYesterdayAgenda;
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
	CREATE TABLE notificar_nova_agenda (
	id SERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL,
	notificado BOOLEAN NOT NULL DEFAULT FALSE,
	ultima_agenda integer NOT NULL,
	created_at timestamp without time zone NOT NULL,
	updated_at timestamp without time zone NOT NULL
	);
*/

/*
	CREATE TABLE pautas_sugeridas (
	id SERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL,
	agenda_id INTEGER NOT NULL,
	sugestao text NOT NULL,
	created_at timestamp without time zone NOT NULL,
	updated_at timestamp without time zone NOT NULL
	);
*/

/*
	CREATE TABLE enquete_participacao (
	id SERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL,
	agenda_id INTEGER NOT NULL,
	foi_ao_conselho boolean,
	gostou boolean,
	constuma_ir boolean,
	input text,
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
	Query para o dataStudio, conselhos por AISp
	SELECT abrangencias.aisp, COUNT(*)
	FROM abrangencias INNER JOIN chatbot_users ON
	(chatbot_users.ccs_id = abrangencias.conselho_id)
	GROUP BY abrangencias.aisp;
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
