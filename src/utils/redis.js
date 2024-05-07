const Ioredis = require('ioredis');
const { Config } = require('../../config');

const options = {
  host: Config.redis.host,
  port: Config.redis.port,
  maxRetriesPerRequest: 20,
};

const redis = new Ioredis(options);

module.exports = {
  redis,
};
