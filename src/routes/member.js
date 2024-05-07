const controllers = require('../controllers');

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
];

module.exports = {
  member,
};
