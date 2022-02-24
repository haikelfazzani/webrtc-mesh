const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);

const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        autoConnect: true,
        transports: ['websocket', 'polling'],
        credentials: false
    },
    allowEIO3: true
});

const socketHandler = require('./server/socketHandler');

io.on('connection', socket => {
    socketHandler(socket, io);
});

server.listen(8000, () => console.log('server is running on port 8000'));
