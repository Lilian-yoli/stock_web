const bcrypt = require('bcrypt');
const { User } = require('../models/user');
const { errorCode } = require('../utils/errorCode');
const { Config } = require('../../config');
const jwt = require('../utils/jwt');

const signUp = async (ctx, next) => {
  const { username, password, confirmedPassword } = ctx.request.body;

  if (!username || !password || !confirmedPassword) {
    return ctx.throw(
      400,
      errorCode.INVALID_ARGC_EMPTY,
    );
  }
  if (password !== confirmedPassword) ctx.throw(400, errorCode.INVALID_PASSWORD);
  try {
    const usernameCheck = await User.findOne({ where: { username } });

    if (usernameCheck) ctx.throw(400, errorCode.INVALID_USERNAME);
    const bcryptPassword = await bcrypt.hash(password, Config.salt);
    await User.create({
      username,
      password: bcryptPassword,
    });

    const token = jwt.generateToken({ username, password: bcryptPassword });
    ctx.body = {
      success: true,
      value: {
        token,
      },
    };
  } catch (error) {
    console.error('Errors in signUp: ', error);
    ctx.throw(error);
  }
  next();
};

const login = async (ctx, next) => {
  const { username, password } = ctx.request.body;

  if (!username || !password) ctx.throw(400, errorCode.INVALID_ARGC_EMPTY);

  try {
    const userInfo = await User.findOne({
      raw: true,
      attributes: ['id', 'username', 'password'],
      where: { username },
    });

    if (!userInfo) ctx.throw(400, errorCode.INVALID_ARGC);

    const { password: bcryptPassword } = userInfo;
    const isValid = await bcrypt.compare(password, bcryptPassword);
    if (!isValid) ctx.throw(400, errorCode.INVALID_ARGC);

    const token = jwt.generateToken(userInfo);

    ctx.body = {
      success: true,
      value: {
        token,
      },
    };
  } catch (error) {
    console.error('Errors occurred in login: ', error);
    ctx.throw(error);
  }
  await next();
};

module.exports = {
  signUp,
  login,
};
