const schedule = require('node-schedule');
const { Op } = require('sequelize');
const moment = require('moment');
const _ = require('lodash');
const { Stocks } = require('../models/stocks');
const apis = require('../utils/apis');
const { sequelize } = require('../models/index');
const tools = require('../utils/tools');
const api = require('../utils/apis');
const { TodayPrice } = require('../models/todayPrice');
const { socketServer } = require('../socketio');

const insertStockInfoToDB = async (stocks) => {
  const lastMonth = new Date().getMonth();
  const thisMonth = lastMonth + 1;
  const transaction = await sequelize.transaction();
  try {
    const lastMonthStocksData = await apis.getMonthlyData(lastMonth, stocks);
    const thisMonthStocksData = await apis.getMonthlyData(thisMonth, stocks);

    await Stocks.destroy({
      where: {
        date:
          {
            [Op.between]:
              [tools.formLastDateOfMonth(lastMonth - 1),
                tools.formLastDateOfMonth(thisMonth)],
          },
      },
      transaction,
    });
    const stocksData = [...lastMonthStocksData, ...thisMonthStocksData];
    for (const stockdata of stocksData) {
      await Stocks.bulkCreate(stockdata, { transaction });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error(`Stock Syncing error - ${JSON.stringify(error)}`);
  }
};

const insertLastDayStocks = async () => {
  const transaction = await sequelize.transaction();
  try {
    const stocksBatch = await apis.getLastDayAllStocks();
    const lastDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
    await Stocks.destroy({
      where: {
        date: {
          [Op.gte]: moment(lastDate).format('YYYY-MM-DD'),
          [Op.lt]: moment().format('YYYY-MM-DD'),
        },
      },
    });

    const insertPromises = stocksBatch.map(async (stocks) => {
      await Stocks.bulkCreate(stocks, { transaction });
    });
    await Promise.all(insertPromises);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error(`insertLastDayStocks errors - ${JSON.stringify(error)}`);
  }
};

const getAllStocksCode = async () => {
  const allStockCodeFromDB = await Stocks.findAll({
    raw: true,
    attributes: ['stockCode'],
    group: ['stockCode'],
  });

  const allStockCode = allStockCodeFromDB.map((data) => data.stockCode);
  return allStockCode;
};

const getRealTimeStocksPrice = async (allStocksCode) => {
  const batchedCodes = _.chunk(allStocksCode, 100);
  const stockDataPromises = batchedCodes.map(async (codes) => {
    const stockData = await api.getTodayData(codes);
    return stockData;
  });
  const allStockData = await Promise.all(stockDataPromises);

  return allStockData;
};
const saveStocksPriceToDb = async (batchedStocksPrice) => {
  await TodayPrice.deleteMany();
  const promises = batchedStocksPrice.map(async (data) => {
    await TodayPrice.insertMany(data);
  });
  await Promise.all(promises);
};

const updateRealTimeStockPrice = async () => {
  const rule = new schedule.RecurrenceRule();
  rule.minute = new schedule.Range(0, 59, 5);
  rule.hour = new schedule.Range(9, 18);
  rule.dayOfWeek = [new schedule.Range(1, 5)];

  schedule.scheduleJob(rule, async () => {
    console.log('Starting to update real-time stocks price.');
    const allStocksCode = await getAllStocksCode();
    const batchedStockPrice = await getRealTimeStocksPrice(allStocksCode);
    await saveStocksPriceToDb(batchedStockPrice);

    socketServer.emit('todayPriceChanged', {});
  });
};

const syncDailyStocksInfoJob = async () => {
  const rule = new schedule.RecurrenceRule();
  rule.minute = 55;
  rule.hour = 23;
  rule.dayOfWeek = [new schedule.Range(1, 5)];

  schedule.scheduleJob(rule, async () => {
    console.log('syncDailyStockInfoJob starts.');
    await insertLastDayStocks();
  });
};

module.exports = {
  insertStockInfoToDB,
  insertLastDayStocks,
  syncDailyStocksInfoJob,
  updateRealTimeStockPrice,
  getAllStocksCode,
  getRealTimeStocksPrice,
  saveStocksPriceToDb,
};
