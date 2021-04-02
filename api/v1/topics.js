const Router = require("@koa/router");
const {
  topics: { getAllTopics },
} = require("../data");

const topics = async (ctx, next) => {
  ctx.body = await getAllTopics(ctx.params.topicId);
  next();
};

module.exports = () => {
  const router = new Router({ prefix: "/topics" });
  router.get("/", topics);
  router.get("/:topicId", topics);

  return router;
};
