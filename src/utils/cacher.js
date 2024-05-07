const { redis } = require('./redis');
const crawler = require('./crawler');

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

module.exports = {
  getStockOfToday,
};
