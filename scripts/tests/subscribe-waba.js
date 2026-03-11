require('dotenv').config();

async function forceSubscribe() {
    const wabaId = "839181512271476"; // We found this WABA ID in the payload previously
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    console.log(`Forcing WABA Webhook Subscription for WABA ID: ${wabaId}...`);

    const url = `https://graph.facebook.com/v20.0/${wabaId}/subscribed_apps`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log("Meta API Response:", data);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

forceSubscribe();
