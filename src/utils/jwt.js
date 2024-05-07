const jwt = require('jsonwebtoken');
const { Config } = require('../../config');

const generateToken = (data) => jwt.sign(data, Config.secret, { expiresIn: 60 * 60 * 24 });

module.exports = {
  generateToken,
};
