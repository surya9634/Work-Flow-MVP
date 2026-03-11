const http = require('http');

http.get('http://localhost:3000/api/twilio/outbound?agentId=123&leadId=456', (res) => {
    let data = '';

    // A chunk of data has been received.
    res.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received.
    res.on('end', () => {
        console.log("Status Code: " + res.statusCode);
        console.log("Headers: " + JSON.stringify(res.headers, null, 2));
        console.log("Body:\n" + data);
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
