const http = require('http');

http.get('http://127.0.0.1:4040/api/requests/http?limit=20', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log(`Found ${json.requests.length} requests in Ngrok:`);
        json.requests.forEach(r => {
            console.log(`- ${r.request.method} ${r.request.uri} -> ${r.response.status_code}`);
        });
    });
});
