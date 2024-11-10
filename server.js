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
        socket.write('FULL_SERVER');
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
        console.log(`\nRequest received from ${socket.remoteAddress}:${socket.remotePort} - ${message}`);
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

const dataDir = path.join(__dirname, 'data');

function handleReadRequest(socket, message) {
    const filename = message.split(' ')[1];
    if (!filename) {
        socket.write('Please specify a file to read.\n');
        return;
    }
    const filePath = path.join(dataDir, filename);
    fs.readFile(filePath, 'utf8', (err, fileData) => {
        if (err) {
            socket.write(`Error reading file ${filename}: ${err.message}\n`);
        } else {
            socket.write(`File contents of ${filename}: ${fileData}\n`);
        }
        processNextClient();
    });
}

function handleWriteRequest(socket, message) {
    const [_, filename, ...textArray] = message.split(' ');
    const text = textArray.join(' ');
    if (!filename || !text) {
        socket.write('Please specify a file and text to write.\n');
        return;
    }
    const filePath = path.join(dataDir, filename);
    fs.writeFile(filePath, text, 'utf8', (err) => {
        if (err) {
            socket.write(`Error writing to file ${filename}: ${err.message}\n`);
        } else {
            socket.write(`Successfully wrote to file ${filename}\n`);
        }
        processNextClient();
    });
}

function handleExecuteRequest(socket, message) {
    const command = message.split(' ')[1];
    if (command === 'see_files') {
        fs.readdir('./data', (err, files) => {
            if (err) {
                socket.write('Error listing files.\n');
            } else {
                socket.write(`Files: ${files.join(', ')}\n`);
            }
            processNextClient();
        });
    } else if (command === 'see_client_log') {
        fs.readFile('connections.log', 'utf8', (err, data) => {
            if (err) {
                socket.write('Error reading client log.\n');
            } else {
                socket.write(`Client log:\n${data}\n`);
            }
            processNextClient();
        });
    } else if (command === 'delete_client_log') {
        fs.unlink('connections.log', (err) => {
            if (err) {
                socket.write('Error deleting client log.\n');
            } else {
                socket.write('Client log deleted.\n');
            }
            processNextClient();
        });
    } else if (command === 'delete_files') {
        fs.readdir('./data', (err, files) => {
            if (err) {
                socket.write('Error retrieving files for deletion.\n');
                return;
            }
            files.forEach(file => {
                fs.unlink(path.join('./data', file), (err) => {
                    if (err) {
                        socket.write(`Error deleting file ${file}: ${err.message}\n`);
                    }
                });
            });
            socket.write('All files deleted in ./data directory.\n');
            processNextClient();
        });
    } else {
        socket.write('Invalid execute command.\n');
        processNextClient();
    }
}

server.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
});
