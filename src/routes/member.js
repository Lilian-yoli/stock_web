const controllers = require('../controllers');
const middleware = require('../middleware');

const member = [
  {
    method: 'post',
    path: '/signup',
    controller: controllers.member.signUp,
  },
  {
    method: 'post',
    path: '/login',
    controller: controllers.member.login,
  },
  {
    method: 'get',
    path: '/userInfo',
    beforeAction: [middleware.beforeAction.authorization],
    controller: controllers.member.getUserInfo,
  },
];

module.exports = {
  member,
};
