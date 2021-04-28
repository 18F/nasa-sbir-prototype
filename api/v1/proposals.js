const Router = require("@koa/router");
const {
  proposals: { getProposal, getProposalsForProgramYear },
} = require("../data");

const proposalsForProgramYear = async (ctx, next) => {
  ctx.body = await getProposalsForProgramYear(ctx.params.year);
  next();
};

const proposal = async (ctx, next) => {
  ctx.body = await getProposal(ctx.params.proposalId);
  next();
};

const proposalsByPhase = async (ctx, next) => {
  const { phase } = ctx.params;
  ctx.body = { ok: true, phase };
  next();
};

module.exports = () => {
  const router = new Router({ prefix: "/proposals" });
  router.get("/", proposalsForProgramYear);
  router.get("/py:year", proposalsForProgramYear);
  router.get("/:proposalId", proposal);
  router.get("/phase/:phase", proposalsByPhase);

  return router;
};
