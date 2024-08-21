const axios = require('axios');
const moment = require('moment');
const _ = require('lodash');
const { csvToObj } = require('csv-to-js-parser');
const tools = require('./tools');

const formFirstDateOfMonth = (month) => {
  const year = new Date().getFullYear();
  if (month === 10 || month === 11 || month === 12) {
    return `${year}${month}01`;
  }
  return `${year}0${month}01`;
};

const getTodayData = async (stockCodes) => {
  const apiBasicUrl = 'http://mis.twse.com.tw/stock/api/getStockInfo.jsp';
  try {
    const exChParam = stockCodes.map((code) => `tse_${code}.tw`).join('|');
    const stockRawData = await axios(apiBasicUrl, {
      params: {
        ex_ch: exChParam,
        json: '1',
        delay: '0',
      },
    }).then((response) => response.data.msgArray)
      .catch((error) => console.error(error));

    const stocksData = stockRawData.map((code) => {
      const {
        z, c, o, n,
      } = code;

      const stockData = {
        code: c,
        name: n,
        price: Number(z) ? Number(z) : null,
        time: moment().toISOString(),
        openPrice: Number(o) ? Number(o) : null,
      };
      return stockData;
    });

    return stocksData;
  } catch (error) {
    console.error(`getTodayData errors - ${JSON.stringify(error)}`);
    throw error;
  }
};

const getMonthlyData = async (month, stockCode) => {
  const url = 'https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json';
  const date = formFirstDateOfMonth(month);

  try {
    const stockInfo = await axios(`${url}&date=${date}&stockNo=${stockCode}`);
    const stockName = stockInfo.data.title.split(' ')[2];
    const stockInfoByStock = stockInfo.data.data.map((data) => ({
      date: new Date(tools.yearConvertor(data[0])),
      name: stockName,
      openPrice: data[3],
      closePrice: data[6],
      stockCode,
      volume: data[1],
    }));

    return stockInfoByStock;
  } catch (error) {
    console.error(`apis getMonthlyData - ${JSON.stringify(error)}`);
  }
};

const getDailyDataFromTWSE = async () => {
  try {
    const { data } = await axios('https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=open_data');
    const description = {
      證券代號: { type: 'string', group: 1 },
      證券名稱: { type: 'string', group: 2 },
      成交股數: { type: 'string', group: 3 },
      收盤價: { type: 'number', group: 4 },
      開盤價: { type: 'number', group: 5 },
    };

    const parsedData = csvToObj(data, ',', description);
    return parsedData;
  } catch (error) {
    console.error(`getDailyDataFromTWSE errors - ${JSON.stringify(error)}`);
  }
};

const getLastDayAllStocks = async () => {
  const stocks = await getDailyDataFromTWSE();
  const stocksToDB = stocks.map((stock) => ({
    stockCode: stock['證券代號'],
    name: stock['證券名稱'],
    date: moment().subtract(1, 'days').format('YYYY-MM-DD'),
    openPrice: stock['開盤價'],
    closePrice: stock['收盤價'],
    volume: stock['成交股數'],
  }));

  const stocksToDBBatch = _.chunk(stocksToDB, 500);
  return stocksToDBBatch;
};

const getLast2WeekTradeDates = async () => {
  const dateBeforeLast2Week = moment().subtract(2, 'weeks');
  const lastMonth = new Date().getMonth();
  const thisMonth = lastMonth + 1;
  const lastMonthData = await axios(`https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${formFirstDateOfMonth(lastMonth)}&stockNo=0050`);
  const thisMonthData = await axios(`https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${formFirstDateOfMonth(thisMonth)}&stockNo=0050`);
  const stocksData = [...lastMonthData.data.data, ...thisMonthData.data.data]
    .map((data) => tools.yearConvertor(data[0]));

  const last2WeekDates = stocksData
    .filter((date) => moment(date).unix() >= dateBeforeLast2Week.unix());
  return last2WeekDates;
};

module.exports = {
  getTodayData,
  getMonthlyData,
  getLastDayAllStocks,
  getLast2WeekTradeDates,
};
