const net = require('net');

const client = new net.Socket();
client.setTimeout(3000);

client.connect(5432, 'aws-1-ap-south-1.pooler.supabase.com', function () {
    console.log('Connected to Supabase port 5432!');
    client.destroy();
});

client.on('error', function (err) {
    console.error('Connection Error:', err.message);
});

client.on('timeout', function () {
    console.error('Connection Timeout');
    client.destroy();
});
