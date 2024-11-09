const net = require('net');
const readline = require('readline');

const PORT = 8080;
const HOST = '127.0.0.1';

let client;
let reconnectTimeout = 5000; 
let isConnected = false; 

function connectToServer() {
    client = new net.Socket();

    client.connect(PORT, HOST, () => {
        console.clear(); 
        console.log(`\n[INFO] Connected to server at ${HOST}:${PORT}`);
        isConnected = true;
        client.write('CLIENT_TYPE FULL_ACCESS'); 
        promptCommand();
    });

    client.on('data', (data) => {
        console.log(`\n[SERVER] ${data.toString().trim()}`);
        if (isConnected) {
            promptCommand();
        }
    });

    client.on('close', () => {
        console.log(`\n\n[INFO] Connection closed. Attempting to reconnect...`);
        isConnected = false;
        setTimeout(connectToServer, reconnectTimeout); 
    });

    client.on('error', (err) => {
        console.log(`\n[ERROR] ${err.message}`);
    });
}
