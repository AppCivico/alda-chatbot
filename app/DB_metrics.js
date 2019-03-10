const { sequelize } = require('./server/index.js');
const { moment } = require('./helpers');

// -- metrics

/*
    // not measuring unique users, nor all interactions, only users who are attached to a ccs
    user_id -> user id, comes from facebook
    user_name -> user name, comes from facebook
    ccs_id -> conselho id that user is attached to right now
    went_before -> user answer to the question "Você já foi em alguma reunião do seu conselho"? Can be null, because user may avoid the question
    created_at -> moment we added the user to the database
	updated_at -> moment we update the user data

    CREATE TABLE chatbot_users (
	id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_name text NOT NULL,
	ccs_id INT,
	went_before BOOLEAN,
	e_mail TEXT,
	phone TEXT,
	created_at timestamp without time zone NOT NULL,
	updated_at timestamp without time zone NOT NULL
	);
*/

// gets all the ids from users we already have in our database
module.exports.getAllChatbotUserID = async () => {
  const result = await sequelize.query(`
	SELECT user_id
	FROM chatbot_users
	ORDER BY updated_at DESC;
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
    console.log('getAllChatbotUserID Success');
    return results;
  }).catch((err) => {
    console.error('Error on getAllChatbotUserID => ', err);
  });
  return result;
};


async function checkChatbotUser(UserID) {
  const result = await sequelize.query(`
	SELECT EXISTS(SELECT 1 FROM chatbot_users WHERE user_id = ${UserID})
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
    console.log(`Checked if ${UserID} exists successfully! => ${results[0].exists}`);
    return results;
  }).catch((err) => {
    console.error('Error on checkChatbotUser => ', err);
  });
  return result[0].exists;
}


async function addChatbotUser(UserID, UserName, ccsID) {
  let date = new Date();
  date = await moment(date).format('YYYY-MM-DD HH:mm:ss');
  UserName.replace('undefined', '');
  await sequelize.query(`
	INSERT INTO chatbot_users(user_id, user_name, ccs_id, created_at, updated_at)
	VALUES ('${UserID}', '${UserName}', '${ccsID}', '${date}', '${date}');
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
    console.log(`Added ${UserID} successfully!`);
  }).catch((err) => {
    console.error('Error on addChatbotUser => ', err);
  });
}
async function addChatbotUserNoCCS(UserID, UserName) {
  let date = new Date();
  date = await moment(date).format('YYYY-MM-DD HH:mm:ss');
  UserName.replace('undefined', '');
  await sequelize.query(`
	INSERT INTO chatbot_users(user_id, user_name, created_at, updated_at)
	VALUES ('${UserID}', '${UserName}', '${date}', '${date}');
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
    console.log(`Added ${UserID} successfully!`);
  }).catch((err) => {
    console.error('Error on addChatbotUser => ', err);
  });
}


async function updateCcsChatbotUser(UserID, UserName, ccsID) {
  let date = new Date();
  date = await moment(date).format('YYYY-MM-DD HH:mm:ss');
  UserName.replace('undefined', '');
  await sequelize.query(`
    UPDATE chatbot_users
	SET user_name = '${UserName}', ccs_id = '${ccsID}', updated_at = '${date}', went_before = 'FALSE'
	WHERE user_id = ${UserID};
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
    console.log(`Updated CCS on ${UserID} successfully!`);
  }).catch((err) => {
    console.error('Error on addChatbotUser => ', err);
  });
}

async function updateCcsChatbotUserNoCCS(UserID, UserName) {
  let date = new Date();
  date = await moment(date).format('YYYY-MM-DD HH:mm:ss');
  UserName.replace('undefined', '');
  await sequelize.query(`
    UPDATE chatbot_users
	SET user_name = '${UserName}', updated_at = '${date}', went_before = 'FALSE'
	WHERE user_id = ${UserID};
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
    console.log(`Updated CCS on ${UserID} successfully!`);
  }).catch((err) => {
    console.error('Error on addChatbotUser => ', err);
  });
}

module.exports.updateWentBeforeChatbotUser = async (UserID, wentBefore) => {
  let date = new Date();
  date = await moment(date).format('YYYY-MM-DD HH:mm:ss');
  await sequelize.query(`
    UPDATE chatbot_users
	SET updated_at = '${date}', went_before = '${wentBefore}'
	WHERE user_id = ${UserID};
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
    console.log(`Updated wentBefore from ${UserID} successfully!`);
  }).catch((err) => {
    console.error('Error on addChatbotUser => ', err);
  });
};

async function updateMailChatbotUserNoCCS(UserID, eMail) {
  let date = new Date();
  date = await moment(date).format('YYYY-MM-DD HH:mm:ss');
  await sequelize.query(`
    UPDATE chatbot_users
	SET e_mail = '${eMail}', updated_at = '${date}'
	WHERE user_id = ${UserID};
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
    console.log(`Updated CCS on ${UserID} successfully!`);
  }).catch((err) => {
    console.error('Error on addChatbotUser => ', err);
  });
}
async function updatePhoneChatbotUserNoCCS(UserID, phone) {
  let date = new Date();
  date = await moment(date).format('YYYY-MM-DD HH:mm:ss');
  await sequelize.query(`
    UPDATE chatbot_users
	SET phone = '${phone}', updated_at = '${date}'
	WHERE user_id = ${UserID};
	`).spread((results, metadata) => { // eslint-disable-line no-unused-vars
    console.log(`Updated CCS on ${UserID} successfully!`);
  }).catch((err) => {
    console.error('Error on addChatbotUser => ', err);
  });
}

async function userAddOrUpdate(context) {
  let CCSID;
  if (context.state.CCS && context.state.CCS.id) {
    CCSID = context.state.CCS.id;
  }
  if (CCSID && CCSID.toString().length > 0) { // check if user has an CCS
    if (await checkChatbotUser(context.session.user.id) !== true) { // if user doesn't exist we add him to database
      await addChatbotUser(context.session.user.id, `${context.session.user.first_name} ${context.session.user.last_name}`, CCSID);
    } else { // user exists
      await updateCcsChatbotUser(context.session.user.id, `${context.session.user.first_name} ${context.session.user.last_name}`, CCSID);
    }
  } else if (await checkChatbotUser(context.session.user.id) !== true) { // no CCS if user doesn't exist we add him to database
    await addChatbotUserNoCCS(context.session.user.id, `${context.session.user.first_name} ${context.session.user.last_name}`);
  } else {
    await updateCcsChatbotUserNoCCS(context.session.user.id, `${context.session.user.first_name} ${context.session.user.last_name}`);
  }
}


module.exports.checkChatbotUser = checkChatbotUser;
module.exports.addChatbotUser = addChatbotUser;
module.exports.updateCcsChatbotUser = updateCcsChatbotUser;
module.exports.userAddOrUpdate = userAddOrUpdate;
module.exports.updateMailChatbotUserNoCCS = updateMailChatbotUserNoCCS;
module.exports.updatePhoneChatbotUserNoCCS = updatePhoneChatbotUserNoCCS;
