const controllers = require('../controllers');
const middleware = require('../middleware');

const stock = [
  {
    method: 'get',
    path: '/list',
    beforeAction: [middleware.beforeAction.authorization],
    controller: controllers.stock.getList,
  },
  {
    method: 'post',
    path: '/userStocks',
    beforeAction: [middleware.beforeAction.authorization],
    controller: controllers.stock.updateStockByMember,
  },
  {
    method: 'get',
    path: '/userStocks',
    beforeAction: [middleware.beforeAction.authorization],
    controller: controllers.stock.getStocksByMember,
  },
];

module.exports = {
  stock,
};
