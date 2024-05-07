const { Sequelize } = require('sequelize');
const { sequelize, BaseModel } = require('./index');

const user = {
  username: { type: Sequelize.TEXT, allowNull: false },
  password: { type: Sequelize.TEXT, allowNull: false },
  ...BaseModel,
};

const options = {
  indexes: [
    {
      unique: true,
      fields: ['username'],
    },
  ],
};

const User = sequelize.define('user', user, options);

module.exports = {
  User,
};
