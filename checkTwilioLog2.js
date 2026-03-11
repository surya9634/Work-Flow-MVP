require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

async function fetchErrors() {
    try {
        const calls = await client.calls.list({ limit: 5 });
        for (const call of calls) {
            console.log(`\nCall SID: ${call.sid}, Status: ${call.status}`);
            const notifications = await client.notifications.list({ callSid: call.sid, limit: 1 });
            notifications.forEach(n => {
                console.error(`  ERROR ${n.errorCode}`);
                console.error(`  Request URL: ${n.requestUrl}`);
            });
        }
    } catch (e) {
        console.error("Error fetching Twilio logs", e);
    }
}
fetchErrors();
