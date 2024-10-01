const mongoose = require('mongoose');

const todayPriceSchema = new mongoose.Schema({
  code: String,
  name: String,
  price: Number,
  openPrice: Number,
  time: Date,
});

const TodayPrice = mongoose.model('today_price', todayPriceSchema);

module.exports = {
  TodayPrice,
};
