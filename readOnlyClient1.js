const net = require('net');
const readline = require('readline');

const PORT = 8080;
const HOST = '127.0.0.1';

const client = new net.Socket();
let reconnectTimeout = 5000;
let isConnected = false;
let isServerFull = false; // New flag to track if server is full

function connectToServer() {
    client.connect(PORT, HOST, () => {
        console.log(`\n[INFO] Connected to server at ${HOST}:${PORT}`);
        isConnected = true;
        client.write('CLIENT_TYPE read');
        promptCommand();
    });

    client.on('data', (data) => {
        const message = data.toString().trim();
        
        if (message === "FULL_SERVER") {
            console.log(`\n[INFO] Server is full.`);
            isServerFull = true; // Set the flag to true if the server is full
            client.end(); // Disconnect without reconnecting
            return;
        }
        
        console.log(`\n[SERVER] ${message}`);
        if (isConnected) {
            promptCommand();
        }
    });

    client.on('close', () => {
        if (!isServerFull) { 
            console.log('\nConnection closed. Attempting to reconnect...');
            isConnected = false;
            setTimeout(connectToServer, reconnectTimeout);
        } else {
            console.log('\n[INFO] Disconnected from server due to full capacity. Not reconnecting.');
        }
    });

    client.on('error', (err) => {
        console.error(`\n[ERROR] ${err.message}`);
    });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptCommand() {
    rl.question("\n[INPUT] Enter filename to read: ", (filename) => {
        if (filename.trim()) {
            client.write(`read ${filename}`);
        } else {
            console.log("[WARN] Invalid filename. Please enter a valid filename.");
            promptCommand();
        }
    });
}

connectToServer();
