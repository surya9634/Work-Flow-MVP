require('dotenv').config();
const twilio = require('twilio');
const fs = require('fs');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function fetchErrors() {
    try {
        const calls = await client.calls.list({ limit: 3 });
        const outputs = [];
        for (const call of calls) {
            const notifications = await client.calls(call.sid).notifications.list({ limit: 2 }).catch(e => []);
            notifications.forEach(n => {
                outputs.push({
                    callSid: call.sid,
                    callStartTime: call.startTime,
                    errorCode: n.errorCode,
                    requestUrl: n.requestUrl,
                    messageDate: n.messageDate,
                });
            });
        }
        fs.writeFileSync('twilio-errors.json', JSON.stringify(outputs, null, 2));
        console.log("Saved to twilio-errors.json");
    } catch (e) {
        console.error("Error", e);
    }
}
fetchErrors();
