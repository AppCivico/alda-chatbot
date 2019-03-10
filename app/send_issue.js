const { formatString } = require('./helpers');
const chatbotAPI = require('./chatbot_api.js');
// const { issueText } = require('./flow.js');

const blacklist = ['sim', 'nao'];

// check if we should create an issue with that text message.If it returns true, we send the appropriate message.
async function createIssue(context) {
  // check if text is not empty and not on the blacklist
  const cleanString = await formatString(context.state.whatWasTyped);
  if (cleanString && cleanString.length > 0 && !blacklist.includes(cleanString)) {
    const issueResponse = await chatbotAPI.postIssue(context.state.politicianData.user_id, context.session.user.id, context.state.whatWasTyped,
      context.state.resultParameters ? context.state.resultParameters : {}, context.state.politicianData.issue_active);

    if (issueResponse && issueResponse.id) { // saved issue
      // await context.sendText(issueText.success);
      return true;
    }
    // await context.sendText(issueText.failure);
    return false;
  }

  return false;
}
module.exports.createIssue = createIssue;
