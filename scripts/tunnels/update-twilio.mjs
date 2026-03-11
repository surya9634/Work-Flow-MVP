import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!accountSid || !authToken || !phoneNumber || !appUrl) {
    console.error("Missing required environment variables for Twilio update.");
    process.exit(1);
}

const client = twilio(accountSid, authToken);

async function updateTwilioWebhook() {
    try {
        console.log(`Searching for Twilio Phone Number: ${phoneNumber}`);
        // Find the specific phone number instance SID
        const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({ phoneNumber: phoneNumber, limit: 1 });

        if (incomingPhoneNumbers.length === 0) {
            console.error("Could not find the specified Twilio phone number in your account.");
            return;
        }

        const sid = incomingPhoneNumbers[0].sid;
        const inboundWebhookUrl = `${appUrl}/api/twilio/inbound`;

        console.log(`Updating Twilio Webhook to: ${inboundWebhookUrl}`);

        // Update the Voice webhook URL
        await client.incomingPhoneNumbers(sid).update({
            voiceUrl: inboundWebhookUrl,
            voiceMethod: 'POST'
        });

        console.log("✅ Twilio Voice Webhook updated successfully!");
    } catch (error) {
        console.error("Failed to update Twilio Webhook:", error);
    }
}

updateTwilioWebhook();
