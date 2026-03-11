import fs from 'fs';

async function update() {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels');
    const data = await res.json();
    const url = data.tunnels[0].public_url;

    let envContent = fs.readFileSync('.env', 'utf-8');
    envContent = envContent.replace(/NEXT_PUBLIC_APP_URL=.*/, `NEXT_PUBLIC_APP_URL="${url}"`);
    fs.writeFileSync('.env', envContent);

    console.log("SUCCESS_URL=" + url);
}

update();
