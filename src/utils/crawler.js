const cheerio = require('cheerio');
const axios = require('axios');

const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)\ AppleWebKit/537.36(KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36' };

const yStockBasicUrl = 'https://tw.stock.yahoo.com/quote/';

const crawlYahooStockSite = async (stockCode) => {
  const webContent = await axios(`${yStockBasicUrl}${stockCode}.TW`, { headers });
  const $ = cheerio.load(webContent.data);
  const name = $('h1').filter((i, element) => $(element).text().trim() !== 'Yahoo奇摩財經').text();
  const price = $('.Fz\\(32px\\)').text();
  const openPrice = $('li.price-detail-item')
    .filter((i, element) => $(element).find('span').first().text()
      .trim() === '開盤')
    .find('span').last()
    .text();

  return {
    price: Number(price),
    openPrice: Number(openPrice),
    name,
    stockCode,
  };
};

module.exports = {
  crawlYahooStockSite,
};
