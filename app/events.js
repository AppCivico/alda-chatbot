const request = require('request');

async function addCustomAction(recipientId, eventName) {
  // for creating custom events on Facebook Analytics
  // recipientId -> the id of the user
  // eventName -> name of the custom event
  // eventName must match regex pattern: \/^[0-9a-zA-Z_][0-9a-zA-Z _-]{0,39}$\/ -> no 'ç', no accents
  request.post({
    url: `https://graph.facebook.com/${process.env.APP_ID}/activities`,
    form: {
      event: 'CUSTOM_APP_EVENTS',
      custom_events: JSON.stringify([{
        _eventName: eventName,
      }]),
      advertiser_tracking_enabled: 0,
      application_tracking_enabled: 0,
      extinfo: JSON.stringify(['mb1']),
      page_id: process.env.PAGE_ID,
      page_scoped_user_id: recipientId,
    },
  }, (err, httpResponse, body) => {
    console.log(`eventName: '${eventName}'\nstatusCode: ${httpResponse.statusCode}\nbody: ${body}`);
    console.error('err:', err);
  });
}

module.exports.addCustomAction = addCustomAction;
