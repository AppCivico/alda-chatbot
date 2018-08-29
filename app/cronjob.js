const Cron = require('cron');

const db = require('./DB_helper');

// Cronjob for notificating users that a ccs they were interested in is now active
const activatedCCS = new Cron.CronJob(
	'*/5 * * * * 1-5', async () => { // At 10h from monday through friday 00 00 10 * * 1-5
		const notifications = await db.getActivatedNotification();
		console.log(notifications);

		let currentCCS = {
			cod_ccs: notifications[0].ccs_cod,
			nome: await db.getNamefromCCS(notifications[0].ccs_cod),
			bairros: await db.getEveryBairro(notifications[0].ccs_cod),
		};

		const sentAlready = {};

		// fix this
		for (let [element] of notifications) { // eslint-disable-line
			if (sentAlready[element.user_id] && sentAlready[element.user_id] === element.ccs_cod) {
				// What happens here: The same user can query if a certain CCS is active multiple times and we store all of them in the database
				// With sentAlready we can detected if we already warned the user that this ccs is now active, so we won't warn him again
			} else if (element.ccs_cod !== currentCCS.cod_ccs) { // check if we are not on the same CCS as before
				// If we are not on the same CCS as before we have to reload the data
				// This is an assurance in case more than one ccs gets activated
				console.log(element);

				currentCCS = await {
					cod_ccs: element.ccs_cod,
					nome: await db.getNamefromCCS(element.ccs_cod),
					bairros: await db.getEveryBairro(element.ccs_cod),
				};
				console.log(`Ei, ${element.user_id}. O ${currentCCS.nome} está ativo agora! Ele encobre as regiões ${currentCCS.bairros.join(', ').replace(/,(?=[^,]*$)/, ' e')}`); // send notification to user to be implemented
			} else {
				console.log(`Ei, ${element.user_id}. O ${currentCCS.nome} está ativo agora! Ele encobre as regiões ${currentCCS.bairros.join(', ').replace(/,(?=[^,]*$)/, ' e')}`); // send notification to user to be implemented
			}
			// finally we send the messages
			sentAlready[element.user_id] = element.ccs_cod; // add user + cod to the alreadySent object because he already knows that this ccs
			// db.updateNotification(element.user_id);
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
