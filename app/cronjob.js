const Cron = require('cron');

const db = require('./DB_helper');

const broadcast = require('./broadcast');

// Cronjob for notificating users that a ccs they were interested in is now active
const activatedCCS = new Cron.CronJob(
	'00 00 10 * * 1-5', async () => { // At 10h from monday through friday 00 00 10 * * 1-5
		const notifications = await db.getActivatedNotification();

		if (notifications.length !== 0) { // checking if there is any notification to send
			let currentCCS = { // loading data from first ccs
				cod_ccs: notifications[0].ccs_cod,
				nome: await db.getNamefromCCS(notifications[0].ccs_cod),
				bairros: await db.getEveryBairro(notifications[0].ccs_cod),
			};

		for (const element of notifications) { // eslint-disable-line
				if (element.ccs_cod !== currentCCS.cod_ccs) { // check if we are not on the same CCS as before
				// If we are not warning on the same CCS as before we have to reload the data
				// This is an assurance in case more than one ccs gets activated
				// Obs: the getActivatedNotification query orders results by the ccs_cod
					currentCCS = { // loading data from the new ccs
						cod_ccs: element.ccs_cod,
						nome: await db.getNamefromCCS(element.ccs_cod), // eslint-disable-line no-await-in-loop
						bairros: await db.getEveryBairro(element.ccs_cod), // eslint-disable-line no-await-in-loop
					};
				}

				// finally we send the messages
				if (await broadcast.sendActivatedNotification(element.user_id, currentCCS.nome, currentCCS.bairros) === true) { // eslint-disable-line no-await-in-loop
					db.updateNotification(element.id); // table boolean gets updated if the message was sent succesfully
				}
			}
		}
	}, (() => {
		console.log('Crontab \'activatedCCSTimer\' stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo',
	false, // context
	// Below: runOnInit => true is useful only for tests
	false // eslint-disable-line comma-dangle
);

module.exports.activatedCCS = activatedCCS;
