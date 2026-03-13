import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
export const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken) {
    console.warn("Missing Twilio credentials in environment variables")
}

export const twilioClient = twilio(accountSid, authToken)

// The base URL for webhooks. In production this should be your Vercel URL.
// Locally it should be your Ngrok URL.
export const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_APP_URL || "https://your-ngrok-url.ngrok.app"
}
