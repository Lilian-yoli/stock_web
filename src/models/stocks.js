const { Sequelize, DataTypes } = require('sequelize');
const { sequelize, BaseModel } = require('./index');

const stocks = {
  stockCode: { type: DataTypes.TEXT, allowNull: false },
  name: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  openPrice: { type: DataTypes.INTEGER, allowNull: false },
  closePrice: { type: DataTypes.INTEGER, allowNull: false },
  ...BaseModel,
};

const options = {
  indexes: [
    {
      fields: ['stockCode', 'date'],
    },
  ],
};

const Stocks = sequelize.define('stocks', stocks, options);

module.exports = {
  Stocks,
};
