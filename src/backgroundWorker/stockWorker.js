const schedule = require('node-schedule');
const { Op } = require('sequelize');
const moment = require('moment');
const { Stocks } = require('../models/stocks');
const apis = require('../utils/apis');
const { sequelize } = require('../models/index');
const tools = require('../utils/tools');

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
};
