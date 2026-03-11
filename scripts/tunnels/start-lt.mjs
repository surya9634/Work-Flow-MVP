import localtunnel from 'localtunnel';
import fs from 'fs';

let config = fs.readFileSync('.env', 'utf-8');
console.log("Starting localtunnel...");

(async () => {
    const tunnel = await localtunnel({ port: 3000 });

    const tunnelUrl = tunnel.url;
    console.log(`\n=========================================\n`);
    console.log(`🚀 LOCALTUNNEL RUNNING AT: ${tunnelUrl}`);
    console.log(`\n=========================================\n`);

    // Update .env with the new localtunnel URL
    config = config.replace(/NEXT_PUBLIC_APP_URL=.*/, `NEXT_PUBLIC_APP_URL="${tunnelUrl}"`);
    fs.writeFileSync('.env', config);

    console.log("✅ Custom .env variable [NEXT_PUBLIC_APP_URL] updated successfully.");
    console.log("✅ Twilio and Meta Webhooks will now automatically resolve to this new URL.");

    tunnel.on('close', () => {
        console.log("Localtunnel closed.");
    });
})();
