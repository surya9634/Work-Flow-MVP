const WebSocket = require('ws');
const url = process.env.NEXT_PUBLIC_APP_URL || "https://exposure-calibration-elegant-dressing.trycloudflare.com";
const wsUrl = url.replace("https://", "wss://") + "/api/twilio/stream";

console.log("Connecting to:", wsUrl);
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
    console.log("SUCCESS: WebSocket connected!");
    ws.send(JSON.stringify({ event: "connected" }));
    setTimeout(() => {
        ws.close();
        process.exit(0);
    }, 2000);
});

ws.on('error', (err) => {
    console.error("ERROR: WebSocket failed to connect:", err);
});

ws.on('close', (code, reason) => {
    console.log(`WebSocket closed: ${code} ${reason}`);
});
