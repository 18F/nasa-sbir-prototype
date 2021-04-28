const Router = require("@koa/router");
const {
  firms: { getFirmStatistics },
} = require("../data");

const firmStatistics = async (ctx, next) => {
  ctx.body = await getFirmStatistics();
  next();
};

module.exports = () => {
  const router = new Router({ prefix: "/firms" });
  router.get("/", firmStatistics);

  return router;
};
