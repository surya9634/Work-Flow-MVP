require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
    console.error("Missing Twilio credentials");
    process.exit(1);
}

const client = twilio(accountSid, authToken);

async function fetchErrors() {
    try {
        console.log("Fetching recent calls...");
        const calls = await client.calls.list({ limit: 5 });

        for (const call of calls) {
            console.log(`\nCall SID: ${call.sid}, To: ${call.to}, Status: ${call.status}, Duration: ${call.duration}`);

            // Fetch notifications (errors) for this call
            const notifications = await client.notifications.list({ callSid: call.sid, limit: 3 });

            if (notifications.length === 0) {
                console.log("  No errors found for this call.");
            } else {
                notifications.forEach(n => {
                    console.error(`  ERROR ${n.errorCode}: ${n.moreInfo}`);
                    console.error(`  MessageText: ${n.messageText}`);
                    console.error(`  Date: ${n.messageDate}`);
                });
            }
        }
    } catch (e) {
        console.error("Error fetching Twilio logs:", e);
    }
}

fetchErrors();
