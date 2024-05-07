const Router = require('koa-router');
const compose = require('koa-compose');
const { member } = require('./member');
const { stock } = require('./stock');

const routeMap = {
  '/stock': stock,
  '/member': member,
};

const proceedNestedRoute = (routes) => {
  const router = new Router();

  if (Array.isArray(routes)) {
    for (let i = 0; i < routes.length; i++) {
      const {
        method, path, controller, beforeAction = [], afterAction = [],
      } = routes[i];

      router[method](path, ...beforeAction, controller, ...afterAction);
    }
  } else if (routes instanceof Object) {
    Object.keys(routes).forEach((key) => {
      const paths = key.startsWith('/') ? key : `/${key}`;
      const nestedRouter = proceedNestedRoute(routes[key]);
      router.use(paths, nestedRouter.routes());
    });
  }

  return router;
};

const proceedRouteMap = (routes, router) => {
  if (!routes || !router) return;
  Object.keys(routes).forEach((key) => {
    const nestedRouter = proceedNestedRoute(routes[key]);
    if (key === '/') {
      router.use(nestedRouter.routes());
    } else {
      router.use(key, nestedRouter.routes());
    }
  });
};

const mainRouter = new Router();
proceedRouteMap(routeMap, mainRouter);

const router = () => compose([
  mainRouter.routes(),
  mainRouter.allowedMethods(),
]);

module.exports = {
  router,
};
