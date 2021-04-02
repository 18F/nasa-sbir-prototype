const Router = require("@koa/router");
const {
  subtopics: {
    getAllSubtopicsByPhase,
    getAllSubtopicsByPhaseAndYear,
    getAllSubtopicsByYear,
    getAllSubtopics,
  },
} = require("../data");

const subtopics = async (ctx, next) => {
  const queryParams = Object.keys(ctx.query).map((key) => key.toLowerCase());

  const byPhase = queryParams.includes("byphase");
  const byYear = queryParams.includes("byyear");

  if (byPhase && byYear) {
    ctx.body = await getAllSubtopicsByPhaseAndYear(ctx.params.subtopicId);
  } else if (byPhase) {
    ctx.body = await getAllSubtopicsByPhase(ctx.params.subtopicId);
  } else if (byYear) {
    ctx.body = await getAllSubtopicsByYear(ctx.params.subtopicId);
  } else {
    ctx.body = await getAllSubtopics(ctx.params.subtopicId);
  }
  next();
};

module.exports = () => {
  const router = new Router({ prefix: "/subtopics" });
  router.get("/", subtopics);
  router.get("/:subtopicId", subtopics);

  return router;
};
