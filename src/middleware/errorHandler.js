const errorHandler = async (ctx, next) => {
  try {
    await next();

    const { status } = ctx;
    if (status === 404) {
      ctx.throw(404);
    }
  } catch (error) {
    ctx.status = error.status || 500;
    if (ctx.status === 404) {
      ctx.body = '404 Not Found';
    } else {
      ctx.body = {
        success: false,
        errorCode: error.type,
        message: error.message,
      };
    }
  }
};

module.exports = {
  errorHandler,
};
