const Cron = require('cron');
const db = require('./DB_helper');

const broadcast = require('./broadcast');

// Cronjob for notificating users that a ccs they were interested in is now active
const activatedCCS = new Cron.CronJob(
	'00 00 10 * * 1-5', async () => { // At 10h from monday through friday 00 00 10 * * 1-5
		const notifications = await db.getActivatedNotification();

		if (notifications.length !== 0) { // checking if there is any notification to send
			let currentCCS = { // loading data from first ccs
				cod_ccs: notifications[0].conselho_id,
				nome: await db.getNamefromCCS(notifications[0].conselho_id),
				bairros: await db.getEveryBairro(notifications[0].conselho_id),
			};

		for (const element of notifications) { // eslint-disable-line
				if (element.conselho_id !== currentCCS.cod_ccs) { // check if we are not on the same CCS as before
				// If we are not warning on the same CCS as before we have to reload the data
				// This is an assurance in case more than one ccs gets activated
				// Obs: the getActivatedNotification query orders results by the conselho_id
					currentCCS = { // loading data from the new ccs
						cod_ccs: element.conselho_id,
						nome: await db.getNamefromCCS(element.conselho_id), // eslint-disable-line no-await-in-loop
						bairros: await db.getEveryBairro(element.conselho_id), // eslint-disable-line no-await-in-loop
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


// Cronjob for notificating users that there was a change in the agenda("calendário") they say
const agendaChange = new Cron.CronJob(
	'00 00 8-22/2 * * 1-5', async () => { // every two hours from 8h to 22h from monday through friday 00 00 8-22/2 * * 1-5
		const notifications = await db.getAgendaNotification();

		const date = new Date();

		if (notifications.length !== 0) { // checking if there is any notification to send
				for (const element of notifications) { // eslint-disable-line
				if (date > element.create_at) { // checks if reunion already happened (create_at is 'behind' current time)
					// updates notificado to TRUE (There's no need to warn the user anymore)
					// It doesn't matter if there was a change to agendas.status or not
					db.updateAgendaNotification(element.id);
				} else if (element.status === 0) { // checks if there was a change in the agenda.status so we can warn the user
					// sending the messages to the user
					if (await broadcast.sendAgendaNotification(element.user_id, element.create_at, element.endereco, element.ccs) === true) { // eslint-disable-line no-await-in-loop
						db.updateAgendaNotification(element.id); // table boolean gets updated if the message was sent succesfully
					}
				} // else: if the reunion hasn't happened already and there was no change (yet?) to the agenda.status there's nothing to do
			}
		}
	}, (() => {
		console.log('Crontab \'agendaChange\' stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo',
	false, // context
	// Below: runOnInit => true is useful only for tests
	false // eslint-disable-line comma-dangle
);

module.exports.agendaChange = agendaChange;
