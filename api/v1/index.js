const Router = require("@koa/router");
const subtopics = require("./subtopics");
const topics = require("./topics");

const getAPIRouter = () => {
  const router = new Router({ prefix: "/v1" });

  [subtopics, topics].forEach((nestedRouterCreator) => {
    const nestedRouter = nestedRouterCreator();
    router.use(nestedRouter.routes());
  });

  return router;
};

module.exports = getAPIRouter;
