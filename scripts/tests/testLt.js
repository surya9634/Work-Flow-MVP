const url = "https://weak-groups-tie.loca.lt/api/twilio/outbound?agentId=123&leadId=456";

async function testRoute() {
    try {
        console.log(`Sending POST to ${url}`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'From=%2B1234567890'
        });
        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text.substring(0, 300)}`);
    } catch (e) {
        console.error("Error", e);
    }
}
testRoute();
