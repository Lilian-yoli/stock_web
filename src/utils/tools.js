const moment = require('moment');

const yearConvertor = (date) => {
  const dateSplit = date.split('/');
  const year = dateSplit[0];
  const month = dateSplit[1];
  const day = dateSplit[2];
  const adYear = Number(year) + 1911;
  return `${adYear}-${month}-${day}`;
};

const formFirstDateOfMonth = (month) => {
  const year = new Date().getFullYear();
  if (month === 10 || month === 11 || month === 12) {
    return moment(`${year}${month}01`);
  }
  return moment(`${year}0${month}01`, 'YYYYMMDD');
};

const formLastDateOfMonth = (month) => {
  const firstDayOfNextMonth = moment(formFirstDateOfMonth(month + 1), 'YYYYMMDD');
  const lastDayOfMonth = firstDayOfNextMonth.subtract(1, 'days');
  return lastDayOfMonth;
};

module.exports = {
  yearConvertor,
  formFirstDateOfMonth,
  formLastDateOfMonth,
};
