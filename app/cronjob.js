const Cron = require('cron');
const db = require('./DB_helper');
const help = require('./helpers');

const broadcast = require('./broadcast');

const { MessengerClient } = require('messaging-api-messenger');
const config = require('./bottender.config').messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

// Cronjob for notificating users that a ccs they were interested in is now active
const activatedCCS = new Cron.CronJob(
	'00 00 10 * * 1-5', async () => { // At 10h from monday through friday 00 00 10 * * 1-5
		const notifications = await db.getActivatedNotification();

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
						db.updateNotification(element.id); // table boolean gets updated if the message was sent succesfully
					}
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


// Cronjob for notificating users that there was a change in the agenda("calendário") they saw
const agendaChange = new Cron.CronJob(
	'00 00 8-22/2 * * 1-5', async () => { // every two hours from 8h to 22h from monday through friday 00 00 8-22/2 * * 1-5
		const notifications = await db.getAgendaNotification();

		console.log(notifications);

		const date = new Date();
		if (notifications) { // if there was any result
			if (notifications && notifications.length !== 0) { // checking if there is any notification to send
				for (const element of notifications) { // eslint-disable-line
					if (date > element.new_datahora) { // checks if reunion already happened (data_hora is 'behind' current time) (date > new_datahora)
					// updates notificado to TRUE (There's no need to warn the user anymore)
					// It doesn't matter if there was a change to agendas.status_id or not
						db.updateAgendaNotification(element.id);

						// finding labelAgenda_id from name
						const ourLabels = await client.getLabelList(); // get all labels we have
						const theOneLabel = await ourLabels.data.find(x => x.name === `agenda${element.agendas_id}`); // find the one label with the name same (we need the id)

						if (theOneLabel) { // if we have that label (we should always have it) we delete it
							await client.deleteLabel(theOneLabel.id);
						}
					} else if (element.status_id !== 4) { // checks if there was any change in agenda
						let message = ''; // the message that will be sent to the user depending on the case
						switch (element.status_id) {
						case 1: // reunion was canceled
							message = `A reunião do ${element.ccs} agendada para ${help.formatDate(element.old_datahora)} no ${element.old_endereco} foi cancelada. ` +
						'Ainda não há nova data, mas você será notificado quando houver.';
							// adding new entry to the table notificacao_agenda because user will be informed when this reunion is rescheduled (status_id agenda must be 2)
							await db.addAgenda(element.user_id, element.agendas_id, element.old_endereco, element.old_datahora.toLocaleString());
							break;
						case 2: // reunion was canceled and changed
							message = `Há uma nova data para a reunião do ${element.ccs} que foi cancelada. Atenção para a mudança:\n\n` +
							`🗓️ *Nova Data*: ${help.formatDate(element.new_datahora)}\n` +
							`🏠 *Novo Local*: ${element.new_endereco}`;
							break;
						case 3: // reunion was canceled and changed
							message = `Alterado: A reunião do ${element.ccs} agendada para ${help.formatDate(element.old_datahora)} no ${element.old_endereco}, foi alterada. ` +
						'Atenção para a mudança:\n\n' +
						`🗓️ *Nova Data*: ${help.formatDate(element.new_datahora)}\n` +
						`🏠 *Novo Local*: ${element.new_endereco}`;
							break;
						default:
							// unknow status_id?
							break;
						}
						console.log(message);

						if (message !== '') { // check if this is a known 'case'
							if (await broadcast.sendAgendaNotification(element.user_id, message) === true) {
								db.updateAgendaNotification(element.id); // table boolean gets updated if the message was sent succesfully
							}
						}
					// sending the messages to the user
					} // else: if the reunion hasn't happened already and there was no change (yet?) to the agenda.status_id there's nothing to do
				}
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

// const DockerTest = new Cron.CronJob(
// 	'*/5 * * * * 1-5', async () => {
// 		console.log('Rodando o docker');
// 		// console.log(await db.getAgenda(1087));

// 		await broadcast.sendAgendaNotification('1864330513659814', 'Teste do docker');
// 	}, (() => {
// 		console.log('Crontab \'agendaChange\' stopped.');
// 	}),
// 	true, /* Starts the job right now (no need for MissionTimer.start()) */
// 	'America/Sao_Paulo',
// 	false, // context
// 	// Below: runOnInit => true is useful only for tests
// 	true // eslint-disable-line comma-dangle
// );

// module.exports.DockerTest = DockerTest;

