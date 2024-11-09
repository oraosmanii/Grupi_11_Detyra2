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