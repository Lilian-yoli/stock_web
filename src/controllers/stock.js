const _ = require('lodash');
const { UserStockList } = require('../models/userStockList');
const { errorCode } = require('../utils/errorCode');
const utils = require('../utils');
const { sequelize } = require('../models');
const { getStockOfToday } = require('../utils/cacher');

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
    const SQL = `SELECT 
                        stockCode,
                        openPrice,
                        closePrice,
                        date,
                        name
                FROM
                        stocks S
                WHERE
                        date BETWEEN DATE('now', '-14 days') AND DATE('now') AND
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

    const historyDataGroupByCode = _.groupBy(historyData, 'stockCode');
    const monitoredStocks = Object.keys(historyDataGroupByCode);

    const stocksOfToday = await getStockOfToday();

    const stocksData = monitoredStocks.map((code) => ({
      dataOfToday: stocksOfToday[code],
      historyData: historyDataGroupByCode[code],
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

module.exports = {
  getList,
  updateStockByMember,
  getStocksByMember,
};
