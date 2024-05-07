const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Config } = require('../../config');
const { User } = require('../models/user');
const { errorCode } = require('../utils/errorCode');

const authorization = async (ctx, next) => {
  const bearerToken = ctx.request.headers.authorization;
  if (!bearerToken) ctx.throw(401, errorCode.INVALID_AUTHORIZATION);
  const token = bearerToken.split(' ')[1];

  const userData = jwt.verify(token, Config.secret, (error, decoded) => {
    if (error) ctx.throw(401, errorCode.INVALID_AUTHORIZATION);
    return decoded;
  });

  try {
    const userInfo = await User.findOne({
      raw: true,
      where: { username: userData.username },
    });
    if (!userInfo) ctx.throw(403, errorCode.INVALID_USER_TOKEN);
    ctx.session = {
      userData,
      expireAt: moment().add(1, 'd').toISOString(),
    };
  } catch (error) {
    ctx.throw(error);
  }
  await next(ctx);
};

module.exports = {
  authorization,
};
