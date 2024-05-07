const { Sequelize, DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./index');

const userStockList = {
  username: { type: DataTypes.TEXT, allowNull: false },
  stockCode: { type: DataTypes.TEXT, allowNull: false },
  ...BaseModel,
};

const options = {
  indexes: [
    {
      fields: ['stockCode', 'username'],
    },
  ],
  freezeTableName: true,
};

const UserStockList = sequelize.define('user_stock_list', userStockList, options);

module.exports = {
  UserStockList,
};
