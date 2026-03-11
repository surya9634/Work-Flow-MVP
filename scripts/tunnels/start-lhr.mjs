import { spawn } from 'child_process';
import fs from 'fs';

let config = fs.readFileSync('.env', 'utf-8');

console.log("Starting Localhost.run SSH Tunnel...");

const tunnel = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-R', '80:localhost:3000',
    'nokey@localhost.run'
]);

let urlFound = false;

function handleData(data) {
    const text = data.toString();

    // localhost.run outputs URLs like https://1234abcd.lhr.life
    const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.(life|zone)/);

    if (match && !urlFound) {
        urlFound = true;
        const tunnelUrl = match[0];

        console.log(`\n=========================================\n`);
        console.log(`🚀 LOCALHOST.RUN TUNNEL RUNNING AT: ${tunnelUrl}`);
        console.log(`\n=========================================\n`);

        // Update .env with the new localtunnel URL
        config = config.replace(/NEXT_PUBLIC_APP_URL=.*/, `NEXT_PUBLIC_APP_URL="${tunnelUrl}"`);
        fs.writeFileSync('.env', config);

        console.log("✅ Custom .env variable [NEXT_PUBLIC_APP_URL] updated successfully.");
        console.log("✅ Twilio and Meta Webhooks will now automatically resolve to this new URL.");
    } else {
        process.stdout.write(text);
    }
}

tunnel.stdout.on('data', handleData);
tunnel.stderr.on('data', handleData);

tunnel.on('close', (code) => {
    console.log(`Localhost.run tunnel process exited with code ${code}`);
});

tunnel.on('error', (err) => {
    console.error("Localhost.run tunnel error:", err);
});
