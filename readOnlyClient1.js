const net = require('net');
const readline = require('readline');

const PORT = 8080;
const HOST = '127.0.0.1';

const client = new net.Socket();
let reconnectTimeout = 5000; 
let isConnected = false; 

function connectToServer() {
    client.connect(PORT, HOST, () => {
        reconnecting = false;
        console.log(`\n[INFO] Connected to server at ${HOST}:${PORT}`);
        isConnected = true;
        client.write('CLIENT_TYPE read'); 
        promptCommand();
    });
}

client.on('data', (data) => {
    console.log(`\n[SERVER] ${data.toString().trim()}`);
    promptCommand();  
});

client.on('close', () => {
    console.log('\nConnection closed. Attempting to reconnect...');
    isConnected = false;
    setTimeout(connectToServer, reconnectTimeout); 
});
client.on('error', (err) => {
    console.error(`\n[ERROR] ${err.message}`);
   
});

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
