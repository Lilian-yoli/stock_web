const jwt = require('jsonwebtoken');
const { Config } = require('../../config');

const generateToken = (data) => jwt.sign(data, Config.secret, { expiresIn: 60 * 60 * 24 });

const authenticate = (token) => {
  const userData = jwt.verify(token, Config.secret, (error, decoded) => {
    if (error) return false;

    return decoded;
  });
  return userData;
};

module.exports = {
  generateToken,
  authenticate,
};
