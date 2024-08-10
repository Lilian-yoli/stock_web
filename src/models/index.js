const Sequelize = require('sequelize');
const mongoose = require('mongoose');
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

mongoose.connect(Config.mongodbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connect successfully');
  })
  .catch((error) => {
    console.error('Fail to connect to MongoDB:', error);
  });

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
