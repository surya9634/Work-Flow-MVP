require('dotenv').config();
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function checkLatestCalls() {
    const calls = await client.calls.list({ limit: 3 });
    for (const call of calls) {
        console.log(`\n--- Call SID: ${call.sid} ---`);
        console.log(`  Status:     ${call.status}`);
        console.log(`  Duration:   ${call.duration}s`);
        console.log(`  To:         ${call.to}`);
        console.log(`  StartTime:  ${call.startTime}`);
        console.log(`  ErrorCode:  ${call.errorCode || 'none'}`);
        console.log(`  ErrorMsg:   ${call.errorMessage || 'none'}`);
    }
}
checkLatestCalls().catch(console.error);
