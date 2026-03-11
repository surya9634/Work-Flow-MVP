import { spawn } from 'child_process';
import fs from 'fs';

let config = fs.readFileSync('.env', 'utf-8');

console.log("Starting Pinggy SSH Tunnel...");

// Spawn SSH process to pinggy.io
const tunnel = spawn('ssh', [
    '-p', '443',
    '-R0:localhost:3000',
    '-o', 'StrictHostKeyChecking=no',
    'a.pinggy.io'
]);

let urlFound = false;

function handleData(data) {
    const text = data.toString();

    // Pinggy outputs URLs like https://rnxeo-123-45-67-89.a.free.pinggy.link
    const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.pinggy\.link/);

    if (match && !urlFound) {
        urlFound = true;
        const tunnelUrl = match[0];

        console.log(`\n=========================================\n`);
        console.log(`🚀 PINGGY TUNNEL RUNNING AT: ${tunnelUrl}`);
        console.log(`\n=========================================\n`);

        // Update .env with the new Pinggy URL
        config = config.replace(/NEXT_PUBLIC_APP_URL=.*/, `NEXT_PUBLIC_APP_URL="${tunnelUrl}"`);
        fs.writeFileSync('.env', config);

        console.log("✅ Custom .env variable [NEXT_PUBLIC_APP_URL] updated successfully.");
        console.log("✅ Twilio and Meta Webhooks will now automatically resolve to this new URL.");
    }
}

tunnel.stdout.on('data', handleData);
tunnel.stderr.on('data', handleData);

tunnel.on('close', (code) => {
    console.log(`Pinggy tunnel process exited with code ${code}`);
});

tunnel.on('error', (err) => {
    console.error("Pinggy tunnel error:", err);
});
