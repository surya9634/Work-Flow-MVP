const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/api/twilio/stream');

ws.on('open', function open() {
    console.log('Connected to local WS server');
    ws.close();
});

ws.on('error', function error(err) {
    console.log('WS Error: ', err.message);
});
