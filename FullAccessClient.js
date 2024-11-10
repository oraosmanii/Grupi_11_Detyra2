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
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptCommand() {
    setTimeout(() => {
        rl.question(`\n[INPUT] Choose a command (read, write, execute): `, (command) => {
            if (command === 'read') {
                rl.question("[INPUT] Enter filename to read: ", (filename) => {
                    client.write(`read ${filename}`);
                });
            } else if (command === 'write') {
                rl.question("[INPUT] Enter filename to write to: ", (filename) => {
                    rl.question("[INPUT] Enter text to write: ", (text) => {
                        client.write(`write ${filename} ${text}`);
                    });
                });
            } else if (command === 'execute') {
                rl.question("[INPUT] Enter function (see_files, see_client_log, delete_client_log, delete_files): ", (func) => {
                    client.write(`execute ${func}`);
                });
            } else {
                console.log("\n[WARN] Invalid command. Please enter 'read', 'write', or 'execute'.");
                promptCommand();
            }
        });
    }, 500);
}

connectToServer();
