const express = require("express");
const path = require('path');
const http = require("http");

const app = express();
const server = http.createServer(app);

const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');

app.disable('x-powered-by');
app.use(compression());

const isProduction = app.get('env') === 'production' || process.env.NODE_ENV === 'production';
isProduction ? '' : app.use(morgan('short'));
app.use(cors('*'));

if (isProduction) {
    app.use(express.static(path.join(__dirname, "client/build")));
    app.use(express.static("public"));

    app.use((req, res, next) => {
        res.sendFile(path.join(__dirname, "client/build", "index.html"));
    });
}

app.get('/', (req, res) => {
    res.send('hello world');
});

const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        autoConnect: true,
        transports: ['websocket', 'polling'],
        credentials: false
    },
    allowEIO3: true
});

const signal = require('./signal');

io.on('connection', socket => {
    signal(socket, io);
});

const PORT = isProduction
    ? process.env.PORT
    : 5000;

server.listen(PORT, () => console.log('server is running on port ' + PORT));
