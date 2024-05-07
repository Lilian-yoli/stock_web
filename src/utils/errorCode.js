const errorCode = {
  INVALID_ARGC_EMPTY: {
    type: 'INVALID_ARGC_EMPTY',
    message: 'The parameter is empty',
  },
  INVALID_ARGC: {
    type: 'INVALID_ARGC',
    message: 'There are error(s) occurred in parameters',
  },
  INVALID_PASSWORD: {
    type: 'INVALID_PASSWORD',
    message: 'Errors occurred in password',
  },
  INVALID_USERNAME: {
    type: 'INVALID_USERNAME',
    message: 'Username is invalid',
  },
  INVALID_USER_TOKEN: {
    type: 'INVALID_USER_TOKEN',
    message: 'User token is invalid',
  },
  INVALID_AUTHORIZATION: {
    type: 'INVALID_AUTHORIZATION',
    message: 'The authorization is not valid',
  },
};

module.exports = {
  errorCode,
};
