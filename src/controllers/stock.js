const _ = require('lodash');
const moment = require('moment');
const { UserStockList } = require('../models/userStockList');
const { errorCode } = require('../utils/errorCode');
const utils = require('../utils');
const { sequelize } = require('../models');
const { Stocks } = require('../models/stocks');
const { TodayPrice } = require('../models/todayPrice');

const findMissingDates = async (historyData, last2WeekTradeDates) => {
  const historyDates = historyData.map((data) => moment(new Date(data.date).toISOString()).format('YYYY-MM-DD'));
  const missingDates = _.difference(last2WeekTradeDates, historyDates);
  return missingDates;
};

const getDataToUpdate = async (months, stockCode) => {
  const getDataPromises = months.map(async (month) => utils.apis.getMonthlyData(month, stockCode));
  const rawStockData = await Promise.all(getDataPromises);
  return rawStockData.flat();
};

const checkAndUpdateHistoryData = async (historyData) => {
  if (!historyData.length) return;

  const { stockCode } = historyData[0];
  const last2WeekTradeDates = await utils.cacher.getLast2WeekTradeDates();

  const missingDates = await findMissingDates(historyData, last2WeekTradeDates);
  if (!missingDates.length) return;

  const monthSet = new Set();
  missingDates.forEach((date) => monthSet.add(moment(date).format('M')));

  const stockData = await getDataToUpdate([...monthSet], stockCode);
  const dataToUpdate = stockData.filter((data) => missingDates.includes(moment(data.date).format('YYYY-MM-DD').toString()));

  await Stocks.bulkCreate(dataToUpdate);
  return dataToUpdate;
};

const getDataOfToday = async (codes) => {
  const todayDataFromMongo = await TodayPrice.find({
    code: { $in: codes },
    price: { $ne: null },
  });
  const codesFromMongo = todayDataFromMongo.map((data) => data.code);
  const codesWithEmptyPrice = _.difference(codes, codesFromMongo);

  const todayStocksFromMongo = todayDataFromMongo.map((data) => {
    const {
      price, name, code, openPrice,
    } = data;
    return {
      stockCode: code,
      name,
      price,
      openPrice,
    };
  });

  if (!codesWithEmptyPrice.length) {
    return todayStocksFromMongo;
  }

  const dataOfTodayPromises = codesWithEmptyPrice.map(
    (code) => utils.cacher.getStockOfTodayByCode(code),
  );
  const dataOfToday = await Promise.all(dataOfTodayPromises);

  return [...dataOfToday, ...todayStocksFromMongo];
};

const getHistoryDataGroupByCode = async (username) => {
  const SQL = `SELECT 
                        stockCode,
                        openPrice,
                        closePrice,
                        date,
                        name,
                        volume
                FROM
                        stocks S
                WHERE
                        date BETWEEN DATE('now', '-14 days') AND DATE('now', '1 days') AND
                        EXISTS
                        (SELECT
                                1
                            FROM 
                                user_stock_list US
                            WHERE
                                US.stockCode = S.stockCode AND
                                US.isValid = true AND
                                US.username = :username) 
                ORDER BY date DESC
    `;

  const historyData = await sequelize.query(SQL, {
    replacements: { username },
    type: sequelize.QueryTypes.SELECT,
  });

  return _.groupBy(historyData, 'stockCode');
};

const getHistoryDataOfStock = async (query) => {
  const SQL = `SELECT
                        date,
                        openPrice,
                        stockCode,
                        closePrice,
                        name,
                        volume
                FROM 
                        stocks
                WHERE
                        date BETWEEN DATE('now', '-14 days') AND DATE('now', '1 days') AND
                        isValid = true AND
                        (stockCode = :query OR name = :query)
                ORDER BY date DESC;
                `;
  const stock = await sequelize.query(SQL, {
    replacements: { query },
    type: sequelize.QueryTypes.SELECT,
  });

  return stock;
};

const getList = async (ctx, next) => {
  const { username } = ctx.session.userData;

  const SQL = `SELECT 
                        MAX(S.name) AS name,
                        S.stockCode,
                        MAX(US.isValid) AS isMonitoring
                FROM
                        stocks AS S
                LEFT JOIN
                        user_stock_list US
                        ON S.stockCode = US.stockCode AND 
                        US.username = :username
                WHERE 
                        S.isValid = true
                GROUP BY
                        S.stockCode
                LIMIT 30
                `;
  try {
    const stockList = await sequelize.query(SQL, {
      replacements: { username },
      type: sequelize.QueryTypes.SELECT,
    });

    ctx.body = {
      success: true,
      value: { stockList },
    };
  } catch (error) {
    console.error('Errors in stock getList: ', error);
    ctx.throw(error);
  }
  next();
};

const updateStockByMember = async (ctx, next) => {
  const { stockCode, isAdding } = ctx.request.body;

  const { username } = ctx.session.userData;
  const userStockData = { stockCode, username };
  if (!stockCode || isAdding === undefined) ctx.throw(400, errorCode.INVALID_ARGC_EMPTY);

  try {
    if (isAdding) {
      const [_response, created] = await UserStockList.findOrCreate({
        where: userStockData,
        defaults: userStockData,
      });
      if (!created) {
        await UserStockList.update(
          { isValid: isAdding },
          {
            where: userStockData,
          },
        );
      }
    } else {
      await UserStockList.update(
        { isValid: isAdding },
        { where: userStockData },
      );
    }

    ctx.body = {
      success: true,
    };
  } catch (error) {
    console.error('Errors in stock updateStockByMember: ', error);
    ctx.throw(error);
  }
  await next();
};

const getStocksByMember = async (ctx, next) => {
  const { username } = ctx.session.userData;
  try {
    const historyDataGroupByCode = await getHistoryDataGroupByCode(username);
    const groupedHistoryData = Object.values(historyDataGroupByCode);

    const checkAndUpdatedPromises = groupedHistoryData.map(async (historyData) => {
      await checkAndUpdateHistoryData(historyData);
    });

    const addedData = (await Promise.all(checkAndUpdatedPromises)).filter((data) => data);
    const isAddedData = addedData.length !== 0;

    const allHistoryDataGroupByCode = isAddedData
      ? await getHistoryDataGroupByCode(username) : historyDataGroupByCode;

    const monitoredStocks = Object.keys(historyDataGroupByCode);

    const dataOfToday = await getDataOfToday(monitoredStocks);
    const stocksData = dataOfToday.map((data) => ({
      dataOfToday: data,
      historyData: allHistoryDataGroupByCode[data.stockCode],
    }));

    ctx.body = {
      success: true,
      value: stocksData,
    };
  } catch (error) {
    console.error('Errors in stock getStocksByMember: ', error);
    ctx.throw(error);
  }
  await next();
};

const getStock = async (ctx, next) => {
  const { query } = ctx.request.query;
  if (!query) ctx.throw(400, errorCode.INVALID_ARGC_EMPTY);

  try {
    const dataOfHistory = await getHistoryDataOfStock(query);
    const addedData = await checkAndUpdateHistoryData(dataOfHistory);
    const isAddedData = !!addedData;

    const stockCodeFromData = dataOfHistory.length ? dataOfHistory[0].stockCode : null;
    const [dataOfToday] = await getDataOfToday([stockCodeFromData]);
    if (!dataOfToday) ctx.throw(400, errorCode.STOCK_NOT_FOUND);

    ctx.body = {
      success: true,
      value: {
        dataOfToday,
        dataOfHistory: isAddedData
          ? await getHistoryDataOfStock(stockCodeFromData)
          : dataOfHistory,
      },
    };
  } catch (error) {
    console.error(`Errors in stock getStock: , ${JSON.stringify(error)}`);
  }
  await next();
};

module.exports = {
  getList,
  updateStockByMember,
  getStocksByMember,
  getStock,
};
