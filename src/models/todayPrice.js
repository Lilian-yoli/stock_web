const mongoose = require('mongoose');

const todayPriceSchema = new mongoose.Schema({
  code: String,
  price: Number,
  time: Date,
});

const TodayPrice = mongoose.model('today_price', todayPriceSchema);

module.exports = {
  TodayPrice,
};
