const Koa = require('koa');

const app = new Koa();
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');
const { createServer } = require('http');
const { socketServer } = require('./src/socketio');

const { sequelize, testDBConnection } = require('./src/models');
const { router } = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const { Config } = require('./config');
const backgroundWorker = require('./src/backgroundWorker');

app
  .use(serve('./public'))
  .use(bodyParser())
  .use(errorHandler)
  .use(router());

const server = createServer(app.callback());
socketServer.initialize(server);

const initialize = async () => {
  backgroundWorker.stockWorker.syncDailyStocksInfoJob();
  backgroundWorker.stockWorker.updateRealTimeStockPrice();
};

server.listen(Config.port, () => {
  console.log(`Application is running on port ${Config.port}`);
  testDBConnection(sequelize);
  initialize();
});
