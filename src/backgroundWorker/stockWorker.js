const schedule = require('node-schedule');
const { Op } = require('sequelize');
const { Stocks } = require('../models/stocks');
const apis = require('../utils/apis');
const { sequelize } = require('../models/index');
const tools = require('../utils/tools');

const STOCKS = [
  '0050', '0056', '2330', '2317', '1216',
];

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

const syncDailyStockInfo = async () => {
  for (let i = 0; i < STOCKS.length; i++) {
    await insertStockInfoToDB(STOCKS);
  }
};

const syncDailyStockInfoJob = () => {
  const rule = new schedule.RecurrenceRule();
  rule.minute = 0;
  rule.hour = 0;
  schedule.scheduleJob(rule, async () => {
    console.log('syncDailyStockInfoJob starts.');
    await syncDailyStockInfo();
  });
};

module.exports = {
  syncDailyStockInfoJob,
  insertStockInfoToDB,
};
