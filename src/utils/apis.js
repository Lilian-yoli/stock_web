const axios = require('axios');
const moment = require('moment');
const tools = require('./tools');

const formFirstDateOfMonth = (month) => {
  const year = new Date().getFullYear();
  if (month === 10 || month === 11 || month === 12) {
    return `${year}${month}01`;
  }
  return `${year}0${month}01`;
};

const getTodayData = async (stockCodes) => {
  const apiBasicUrl = 'http://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=';
  try {
    const dataOfTodayPromises = stockCodes.map(async (code) => {
      const {
        o, y, z, d, n,
      } = await axios(`${apiBasicUrl}tse_${code}.tw`)
        .then((data) => data.data.msgArray[0])
        .catch((error) => { throw error; });

      const dataByCode = {};
      dataByCode[code] = {
        name: n,
        openPrice: o,
        closePrice: y,
        price: z,
        date: moment(d, 'YYYYMMDD').toISOString(),
      };
      return dataByCode;
    });

    const dataOfToday = await Promise.all(dataOfTodayPromises);
    return dataOfToday;
  } catch (error) {
    console.error(`getTodayData errors - ${JSON.stringify(error)}`);
    throw error;
  }
};

const getMonthlyData = async (month, stockCodes) => {
  const url = 'https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json';
  const date = formFirstDateOfMonth(month);
  const stockData = [];
  try {
    for (const stockCode of stockCodes) {
      const stockInfo = await axios(`${url}&date=${date}&stockNo=${stockCode}`);
      const stockName = stockInfo.data.title.split(' ')[2];
      const stockInfoByStock = stockInfo.data.data.map((data) => ({
        date: new Date(tools.yearConvertor(data[0])),
        name: stockName,
        openPrice: data[3],
        closePrice: data[6],
        stockCode,
      }));

      stockData.push(stockInfoByStock);
    }

    return stockData;
  } catch (error) {
    console.error(`apis getMonthlyData - ${JSON.stringify(error)}`);
  }
};

module.exports = {
  getTodayData,
  getMonthlyData,
};
