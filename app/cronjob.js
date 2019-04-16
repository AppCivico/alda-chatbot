const Cron = require('cron');
const { MessengerClient } = require('messaging-api-messenger');

const db = require('./DB_helper');
const help = require('./helpers');
const { Sentry } = require('./helpers');
const broadcast = require('./broadcast');
const config = require('./bottender.config').messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});


// Cronjob to notificate users that a ccs they were interested in is now active
const activatedCCS = new Cron.CronJob(
	'00 00 10 * * 1-5', async () => { // At 10h from monday through friday 00 00 10 * * 1-5
		let notifications = 'Not loaded';
		await Sentry.configureScope(async (scope) => {
			notifications = await db.getActivatedNotification();
			scope.setExtra('notifications', notifications);

			if (notifications) { // if there was any result
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
								nome: await db.getNamefromCCS(element.conselho_id),
								bairros: await db.getEveryBairro(element.conselho_id),
							};
						}

						// finally we send the messages
						if (await broadcast.sendActivatedNotification(element.user_id, currentCCS.nome, currentCCS.bairros) === true) {
							await db.updateNotification(element.id); // table boolean gets updated if the message was sent succesfully
						}
					}
				}
			}
		});
	}, (() => {
		console.log('Crontab \'activatedCCSTimer\' stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo',
	false, // context
	// Below: runOnInit => true is useful only for tests
	false // eslint-disable-line comma-dangle
);

// Cronjob to notificate  users that there was a change in the agenda("calendário") they saw
const agendaChange = new Cron.CronJob(
	'00 00 8-22/2 * * 1-5', async () => { // every two hours from 8h to 22h from monday through friday 00 00 8-22/2 * * 1-5
		let notifications = 'not loaded';
		await Sentry.configureScope(async (scope) => {
			notifications = await db.getAgendaNotification();
			scope.setExtra('notifications', notifications);

			const date = new Date();
			if (notifications) { // if there was any result
				if (notifications && notifications.length !== 0) { // checking if there is any notification to send
					for (const element of notifications) { // eslint-disable-line
						element.newDatahora = new Date(`${element.data} ${element.hora}`);
						if (date > element.newDatahora) { // checks if reunion already happened (data_hora is 'behind' current time) (date > element.newDatahora)
							// updates notificado to TRUE (There's no need to warn the user anymore) // It doesn't matter if there was a change to agendas.status_id or not
							await db.updateAgenda(element.id, 'TRUE');
							const ourLabels = await client.getLabelList(); // get all labels we have
							// finding labelAgenda_id from name
							const theOneLabel = await ourLabels.data.find(x => x.name === `agenda${element.agendas_id}`); // find the one label with the name same (we need the id)

							if (theOneLabel) { // if we have that label (we should always have it) we delete it
								await client.deleteLabel(theOneLabel.id);
							}
						} else if (element.status_id !== 4) { // checks if there was any change in agenda
							let message = ''; // the message that will be sent to the user depending on the case
							switch (element.status_id) {
							case 1: // reunion was canceled
								message = `A reunião do ${element.ccs} agendada para ${help.formatDate(element.old_datahora).toLocaleString()} no local`
										+ `${element.endereco}, ${element.bairro} foi cancelada. Ainda não há nova data, mas você será notificado quando houver.`;
								// adding new entry to the table notificacao_agenda because user will be informed when this reunion is rescheduled (status_id agenda must be 2)
								await db.addAgenda(element.user_id, element.agendas_id, element.old_endereco, element.old_datahora.toLocaleString());
								break;
							case 2: // reunion was canceled and changed
								message = await help.getAgendaMessageTimer(element, `Há uma nova data para a reunião do ${element.ccs} que foi cancelada. Atenção para a mudança:\n\n`);
								break;
							case 3: // reunion was canceled and changed
								message = await help.getAgendaMessageTimer(
									element,
									`A reunião do ${element.ccs} agendada para *${help.formatDate(element.old_datahora)}* no *${element.old_endereco}*, foi alterada. Atenção para a mudança:\n\n`,
								);
								break;
							default: // unknow status_id?
								break;
							}
							if (message !== '') { // check if this is a known 'case'
								if (await broadcast.sendAgendaNotification(element.user_id, message) === true) {
									await db.updateAgenda(element.id, 'TRUE'); // table boolean gets updated if the message was sent succesfully
								}
							}
							// sending the messages to the user
						} // else: if the reunion hasn't happened already and there was no change (yet?) to the agenda.status_id there's nothing to do
					}
				}
			}
		});
	}, (() => {
		console.log('Crontab \'agendaChange\' stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo',
	false, // context
	// Below: runOnInit => true is useful only for tests
	false // eslint-disable-line comma-dangle
);

// Cronjob to notificate users that there was a change in the agenda("calendário") they saw
const newAgenda = new Cron.CronJob(
	'00 30 8-22/2 * * 1-5', async () => { // every two hours from 8h to 22h from monday through friday 00 30 8-22/2 * * 1-5
		let notifications = 'not loaded';
		await Sentry.configureScope(async (scope) => {
			notifications = await db.getNovaAgenda();
			scope.setExtra('notifications', notifications);

			if (notifications) { // if there was any result
				if (notifications && notifications.length !== 0) { // checking if there is any notification to send
					for (const element of notifications) { // eslint-disable-line
						const agenda = await db.getAgenda(element.conselho_id); // getting most recent agenda
						// if: the newest agenda is the one the user saw, so there's nothing to do -> agenda.id !== element.ultima_agenda
						if (agenda && agenda.id && agenda.id !== element.ultima_agenda) {
							const message = `Temos uma nova reunião agendada para o *${element.ccs}*! Atenção para data e local:\n\n`
							+ `${await help.getAgendaMessage(agenda)}`;
							if (await broadcast.sendAgendaNotification(element.user_id, message) === true) {
								await db.updateNovaAgenda(element.id, 'TRUE'); // table boolean gets updated if the message was sent succesfully
							}
						}
					}
				}
			}
		});
	}, (() => {
		console.log('Crontab \'newAgenda\' stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo',
	false, // context
	// Below: runOnInit => true is useful only for tests
	false // eslint-disable-line comma-dangle
);

// Cronjob to notificate users that there was a change in the agenda("calendário") they saw
const enqueteParticipacao = new Cron.CronJob(
	'00 30 10 * * 1-5', async () => { // every two hours from 8h to 22h from monday through friday 00 30 8-22/2 * * 1-5
		let notifications;
		await Sentry.configureScope(async (scope) => {
			notifications = await db.getYesterdayAgenda();
			scope.setExtra('notifications', notifications);

			if (notifications && notifications.length !== 0) { // checking if there is any notification to send
			for (const element of notifications) { // eslint-disable-line
					await broadcast.sendEnqueteParticipacao(element.user_id, element.agendas_id);
				}
			}
		});
	}, (() => {
		console.log('Crontab \'enqueteParticipacao\' stopped.');
	}),
	true, /* Starts the job right now (no need for MissionTimer.start()) */
	'America/Sao_Paulo',
	false, // context
	// Below: runOnInit => true is useful only for tests
	true // eslint-disable-line comma-dangle
);

module.exports.activatedCCS = activatedCCS;
module.exports.agendaChange = agendaChange;
module.exports.newAgenda = newAgenda;
module.exports.enqueteParticipacao = enqueteParticipacao;

// */5 * * * * *
