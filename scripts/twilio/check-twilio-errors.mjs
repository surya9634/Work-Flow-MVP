import twilio from "twilio";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function checkErrors() {
    try {
        const results = [];
        const calls = await client.calls.list({ limit: 3 });
        for (const call of calls) {
            const notifications = await client.calls(call.sid).notifications.list({ limit: 2 });
            results.push({
                sid: call.sid,
                status: call.status,
                startTime: call.startTime,
                errors: notifications.map(n => ({ code: n.errorCode, msg: n.messageText }))
            });
        }
        fs.writeFileSync("twilio-errors.json", JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    }
}
checkErrors();
