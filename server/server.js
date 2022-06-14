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
app.use(cors(isProduction ? 'http://la-reunion.ml' : 'http://localhost:3000'));

app.get('/', (req, res) => {
  res.status(200).send('hello world');
});

const io = require('socket.io')(server, {
  cors: {
    origin: isProduction
      ? ['http://la-reunion.ml', 'http://wwww.la-reunion.ml', 'https://webrtccc.netlify.app']
      : ['http://localhost:3000', 'http://localhost:5000'],
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

server.listen(PORT, () => console.log(process.env.NODE_ENV + ': server is running on port => ' + PORT));
