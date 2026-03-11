const url = process.env.NEXT_PUBLIC_APP_URL || "https://exposure-calibration-elegant-dressing.trycloudflare.com";
const fetchStr = `${url}/api/twilio/outbound?agentId=123&leadId=456`;

async function testRoute() {
    try {
        console.log(`Sending POST to ${fetchStr}`);
        const res = await fetch(fetchStr, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'From=%2B1234567890'
        });
        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text.substring(0, 200)}`);
    } catch (e) {
        console.error("Error", e);
    }
}
testRoute();
