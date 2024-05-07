const cheerio = require('cheerio');
const axios = require('axios');

const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)\ AppleWebKit/537.36(KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36' };

const yStockBasicUrl = 'https://tw.stock.yahoo.com/quote/';

const STOCKS = [
  '0050', '0056', '2330', '2317', '1216',
];

const crawlYahooStockSite = async (stockCode) => {
  const webContent = await axios(`${yStockBasicUrl}${stockCode}`, { headers });
  const $ = cheerio.load(webContent.data);
  const name = $('h1').filter((i, element) => $(element).text().trim() !== 'Yahoo奇摩財經').text();
  const price = $('.Fz\\(32px\\)').text();
  const openPrice = $('li.price-detail-item')
    .filter((i, element) => $(element).find('span').first().text()
      .trim() === '開盤')
    .find('span').last()
    .text();

  return {
    price, openPrice, name, stockCode,
  };
};

const crawlStocksOfYahooStock = async () => {
  const crawlPromises = STOCKS.map(async (data) => crawlYahooStockSite(data));
  const dataOfStocks = await Promise.all(crawlPromises);
  const dataOfStocksMap = dataOfStocks.reduce((acc, data) => {
    acc[data.stockCode] = data;
    return acc;
  }, {});
  return dataOfStocksMap;
};

module.exports = {
  crawlYahooStockSite,
  crawlStocksOfYahooStock,
};
