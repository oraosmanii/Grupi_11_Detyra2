const net = require('net');
const readline = require('readline');

const PORT = 8080;
const HOST = '127.0.0.1';

let client;
let reconnectTimeout = 5000; 
let isConnected = false; 
