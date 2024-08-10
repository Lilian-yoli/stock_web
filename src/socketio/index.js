const { Server } = require('socket.io');
const { Config } = require('../../config');
const { authenticate } = require('../utils/jwt');
const { TodayPrice } = require('../models/todayPrice');

class SocketServer {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: `http://localhost:${Config.port}`,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      },
    });

    this.io.use((socket, next) => {
      const { token } = socket.handshake.query;
      const userData = authenticate(token);
      if (!userData) console.log('Token from socket is invalid.');
      next();
    });

    this.io.on('connection', (socket) => {
      socket.on('todayPriceCode', async (data) => {
        const stockData = await TodayPrice.find({ code: { $in: data } });
        const stockPriceByCodes = stockData.reduce((acc, stock) => {
          if (!acc[stock.code] && stock.price) {
            acc[stock.code] = stock.price;
          }
          return acc;
        }, {});

        this.io.emit('todayPriceByCode', stockPriceByCodes);
      });

      socket.on('Client disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  emit(topic, body, callback) {
    if (!this.io) return;
    this.io.emit(topic, body, callback);
  }
}

const socketServer = new SocketServer();

module.exports = {
  socketServer,
};
