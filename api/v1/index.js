const Router = require("@koa/router");
const firms = require("./firms");
const proposals = require("./proposals");
const subtopics = require("./subtopics");
const topics = require("./topics");

const getAPIRouter = () => {
  const router = new Router({ prefix: "/v1" });

  [firms, proposals, subtopics, topics].forEach((nestedRouterCreator) => {
    const nestedRouter = nestedRouterCreator();
    router.use(nestedRouter.routes());
  });

  return router;
};

module.exports = getAPIRouter;
