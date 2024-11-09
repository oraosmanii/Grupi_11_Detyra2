const net = require('net');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const HOST = '127.0.0.1';
const MAX_CLIENTS = 4;
const IDLE_TIMEOUT = 40000;

let fullAccessQueue = [];
let readQueue = [];
let activeClientCount = 0;

const server = net.createServer((socket) => {
    
    if (activeClientCount >= MAX_CLIENTS) {
        socket.write('\n\nServer full, please try later.\n');
        socket.end();
        return;
    }

    activeClientCount++; 
    console.log(`\nClient connected: ${socket.remoteAddress}:${socket.remotePort}`);
    logConnection(socket);

   
    socket.setTimeout(IDLE_TIMEOUT);
    socket.on('timeout', () => {
      console.log(`\nClient ${socket.remoteAddress}:${socket.remotePort} disconnected due to inactivity.`);
      removeFromQueue(socket); 
      socket.end(); 
    });
    
    socket.on('data', (data) => {
        const message = data.toString().trim();

       
        if (message.startsWith("CLIENT_TYPE")) {
            const clientType = message.split(' ')[1];
            if (clientType === 'read' || clientType === 'FULL_ACCESS') {
                socket.clientType = clientType;
                if (clientType === 'FULL_ACCESS') {
                    fullAccessQueue.push(socket);
                } else {
                    readQueue.push(socket);
                }
                socket.write(`Client type set to ${clientType}\n`);
                processNextClient();  
            } else {
                socket.write('Invalid client type. Please specify "read" or "FULL_ACCESS".\n');
            }
            return;
        }

        
        switch (true) {
            case (socket.clientType === 'read' && message.startsWith('write')):
                socket.write('Permission denied: Read-only clients cannot write.\n');
                break;

            case (socket.clientType === 'read' && message.startsWith('execute')):
                socket.write('Permission denied: Read-only clients cannot execute.\n');
                break;

            case (socket.clientType === 'FULL_ACCESS' || socket.clientType === 'read'):
                if (message.startsWith('read')) {
                    handleReadRequest(socket, message);
                } else if (message.startsWith('write')) {
                    handleWriteRequest(socket, message);
                } else if (message.startsWith('execute')) {
                    handleExecuteRequest(socket, message);
                } else {
                    socket.write('Invalid command\n');
                }
                break;

            default:
                socket.write('Please declare your client type first using "CLIENT_TYPE read" or "CLIENT_TYPE FULL_ACCESS".\n');
        }

       
        logRequest(socket, message);
    });


    socket.on('end', () => {
        console.log(`Client disconnected: ${socket.remoteAddress}`);
        removeFromQueue(socket);
        activeClientCount--;
    });

 
    socket.on('error', (err) => {
        console.log(`Socket error: ${err.message}`);
    });
});


function processNextClient() {
    
    const nextClient = fullAccessQueue.length > 0 ? fullAccessQueue.shift() : readQueue.shift();
    if (nextClient) {
        nextClient.write('You are now being served.\n');
    }
}

function removeFromQueue(socket) {
    if (socket.clientType === 'FULL_ACCESS') {
        fullAccessQueue = fullAccessQueue.filter(client => client !== socket);
    } else if (socket.clientType === 'read') {
        readQueue = readQueue.filter(client => client !== socket);
    }
}


function logConnection(socket) {
    const logData = `Connected: ${socket.remoteAddress} at ${new Date()}\n`;
    fs.appendFileSync('connections.log', logData);
}


function logRequest(socket, data) {
    const logData = `Request from ${socket.remoteAddress} at ${new Date()}: ${data}\n`;
    fs.appendFileSync('requests.log', logData);
}
