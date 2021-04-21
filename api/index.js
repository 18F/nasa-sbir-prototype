const Koa = require("koa");
const cors = require("@koa/cors");
const Router = require("@koa/router");
const v1routes = require("./v1");
const web = require("./web");

const main = async () => {
  const app = new Koa();
  const port = process.env.PORT || 8000;

  app.use(cors());

  app.use(web);

  const v1 = v1routes();
  app.use(v1.routes(), v1.allowedMethods());

  const base = new Router();
  base.get("/heartbeat", async (ctx, next) => {
    ctx.body = { ok: true };
    return next();
  });
  app.use(base.routes(), base.allowedMethods());

  app.listen(port, () => {
    console.log(`now listening on ${port}`);
  });
};

main();
