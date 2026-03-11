import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';

let config = fs.readFileSync('.env', 'utf-8');

console.log("Starting Ngrok Tunnel...");

// Start ngrok in the background
const tunnel = spawn('ngrok', ['http', '3000']);

let urlFound = false;

// Ngrok exposes a local JSON API at port 4040 where we can fetch the active public URL.
// We will poll it until the URL is ready.
const pollInterval = setInterval(() => {
    http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                const publicUrl = parsedData.tunnels[0].public_url;

                if (publicUrl && !urlFound) {
                    urlFound = true;
                    clearInterval(pollInterval);

                    console.log(`\n=========================================\n`);
                    console.log(`🚀 NGROK TUNNEL RUNNING AT: ${publicUrl}`);
                    console.log(`\n=========================================\n`);

                    // Update .env with the new Ngrok URL
                    config = config.replace(/NEXT_PUBLIC_APP_URL=.*/, `NEXT_PUBLIC_APP_URL="${publicUrl}"`);
                    // Also update NEXTAUTH_URL so login redirects go back to Ngrok, not localhost
                    config = config.replace(/NEXTAUTH_URL=.*/, `NEXTAUTH_URL="${publicUrl}"`);
                    fs.writeFileSync('.env', config);

                    console.log("✅ Custom .env variable [NEXT_PUBLIC_APP_URL] updated successfully.");
                    console.log("✅ Custom .env variable [NEXTAUTH_URL] updated successfully.");
                    console.log("✅ Twilio and Meta Webhooks will now automatically resolve to this new URL.");
                }
            } catch (e) {
                // Not ready yet
            }
        });
    }).on('error', (e) => {
        // Not ready yet
    });
}, 1000);

tunnel.on('close', (code) => {
    console.log(`Ngrok tunnel process exited with code ${code}`);
});

process.on('SIGINT', () => {
    tunnel.kill();
    process.exit();
});
