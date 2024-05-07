const Sequelize = require('sequelize');
const { Config } = require('../../config');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: Config.databaseStorage,
});

const BaseModel = {
  isValid: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
};

const testDBConnection = async (seql) => {
  try {
    await seql.authenticate();
    console.log('DB connect successfully!');
  } catch (error) {
    console.error('Unable to connect to DB:', error);
  }
};

module.exports = {
  sequelize,
  testDBConnection,
  BaseModel,
};
