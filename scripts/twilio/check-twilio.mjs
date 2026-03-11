import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
client.incomingPhoneNumbers.list({ phoneNumber: process.env.TWILIO_PHONE_NUMBER, limit: 1 }).then(nums => { console.log('Current Voice URL:', nums[0].voiceUrl); }).catch(console.error);
