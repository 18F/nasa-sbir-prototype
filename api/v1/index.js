const Router = require("@koa/router");
const focusAreas = require("./focusAreas");

const getAPIRouter = () => {
  const router = new Router({ prefix: "/v1" });

  [focusAreas].forEach((nestedRouterCreator) => {
    const nestedRouter = nestedRouterCreator();
    router.use(nestedRouter.routes());
  });

  return router;
};

module.exports = getAPIRouter;
