const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);

const compression = require('compression');
const morgan = require('morgan');
const cors = require('./middlewares/cors');

app.disable('x-powered-by');
app.use(compression());

require('dotenv').config();

const isProduction = app.get('env') === 'production' || process.env.NODE_ENV === 'production';
isProduction ? '' : app.use(morgan('short'));
app.use(cors);

app.get('/', (req, res) => {
  res.status(200).send('hello world');
});

const io = require('socket.io')(server, {
  cors: {
    origin: isProduction
      ? JSON.parse(process.env.ALLOWED_PRODUCTION_DOMAIN)
      : JSON.parse(process.env.ALLOWED_DEV_DOMAIN),
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
