import { spawn } from 'child_process';
import fs from 'fs';

let config = fs.readFileSync('.env', 'utf-8');

console.log("Starting native Cloudflare Tunnel...");

// Spawn cloudflared process
const tunnel = spawn('./cloudflared.exe', ['tunnel', '--url', 'http://localhost:3000']);

let urlFound = false;

function handleData(data) {
    const text = data.toString();

    // Look for the URL pattern like https://random-words.trycloudflare.com
    const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/);

    if (match && !urlFound) {
        urlFound = true;
        const tunnelUrl = match[0];

        console.log(`\n=========================================\n`);
        console.log(`🚀 TUNNEL RUNNING AT: ${tunnelUrl}`);
        console.log(`\n=========================================\n`);

        // Update .env with the new Cloudflare URL
        config = config.replace(/NEXT_PUBLIC_APP_URL=.*/, `NEXT_PUBLIC_APP_URL="${tunnelUrl}"`);
        fs.writeFileSync('.env', config);

        console.log("✅ Custom .env variable [NEXT_PUBLIC_APP_URL] updated successfully.");
        console.log("✅ Twilio and Meta Webhooks will now automatically resolve to this new URL.");
    }
}

// cloudflared outputs most of its logs, including the URL, to stderr
tunnel.stdout.on('data', handleData);
tunnel.stderr.on('data', handleData);

tunnel.on('close', (code) => {
    console.log(`Cloudflare tunnel process exited with code ${code}`);
});

tunnel.on('error', (err) => {
    console.error("Cloudflare tunnel error:", err);
});
