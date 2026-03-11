const { spawn } = require('child_process');
const fs = require('fs');

const out = fs.openSync('./ngrok-log.txt', 'a');
const err = fs.openSync('./ngrok-log.txt', 'a');

const child = spawn('node', ['start-ngrok.mjs'], {
    detached: true,
    stdio: ['ignore', out, err]
});

child.unref();
console.log(`Detached Ngrok launcher started with PID: ${child.pid}`);
