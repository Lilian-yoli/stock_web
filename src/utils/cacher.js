const { redis } = require('./redis');
const crawler = require('./crawler');
const apis = require('./apis');

const cacher = async (key, callback, ttl = 60) => {
  const cacheData = await redis.get(key);
  if (cacheData) return JSON.parse(cacheData);

  const data = await callback();
  await redis.set(key, JSON.stringify(data), 'EX', ttl);
  return data;
};

const getStockOfToday = async () => {
  try {
    const key = 'stock:stockOfToday';
    const result = await cacher(key, crawler.crawlStocksOfYahooStock, 600);
    return result;
  } catch (error) {
    console.error(`error in getStockOfToday - ${JSON.stringify(error)}`);
  }
};

const getStockOfTodayByCode = async (code) => {
  try {
    if (!code) return {};
    const key = `stock:stockOfToday:${code}`;
    const result = await cacher(key, () => crawler.crawlYahooStockSite(code), 600);
    return result;
  } catch (error) {
    console.error(`error in getStockOfToday - ${JSON.stringify(error)}`);
  }
};

const getLast2WeekTradeDates = async () => {
  try {
    const key = 'stock:historyData:stockDates';
    const result = await cacher(key, apis.getLast2WeekTradeDates, 3600);
    return result;
  } catch (error) {
    console.error(`error in getLast2WeekTradeDates - ${JSON.stringify(error)}`);
  }
};

module.exports = {
  getStockOfToday,
  getLast2WeekTradeDates,
  getStockOfTodayByCode,
};
