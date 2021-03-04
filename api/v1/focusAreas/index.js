const Router = require("@koa/router");
const {
  focusAreas: { getAllFocusAreas },
} = require("../../data");

const getAll = async (ctx, next) => {
  const focusAreas = await getAllFocusAreas();
  ctx.body = focusAreas;
  next();
};

const getByYear = async (ctx, next) => {
  const { year } = ctx.params;

  if (Number.isNaN(+year)) {
    ctx.throw(400, "year must be a number");
  }

  const focusAreas = await getAllFocusAreas();
  ctx.body = focusAreas;
  next();
};

module.exports = () => {
  const router = new Router({ prefix: "/focusAreas" });
  router.get("/", getAll);
  router.get("/:year", getByYear);

  return router;
};
