require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function check() {
    const calls = await client.calls.list({ limit: 5 });
    for (const c of calls) {
        console.log(`Call SID: ${c.sid} | Status: ${c.status} | Time: ${c.startTime}`);
        const errors = await client.calls(c.sid).notifications.list({ limit: 5 }).catch(e => []);
        errors.forEach(e => {
            console.log(`  -> ERROR: ${e.errorCode}, text: ${e.messageText}`);
        });
    }
}
check();
