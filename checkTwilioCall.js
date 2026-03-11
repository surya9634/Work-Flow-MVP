require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function checkCallStatus() {
    try {
        const call = await client.calls('CA09d14a357c4dbeeb95f13e688df0e1e7').fetch();
        console.log(`Call SID: ${call.sid}`);
        console.log(`Status: ${call.status}`);
        console.log(`Answered By: ${call.answeredBy}`);
        console.log(`Duration: ${call.duration}s`);
        console.log(`Error Code: ${call.errorCode || 'None'}`);
        console.log(`Error Message: ${call.errorMessage || 'None'}`);
    } catch (e) {
        console.error("Twilio Error:", e);
    }
}
checkCallStatus();
