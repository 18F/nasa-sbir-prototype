const Koa = require("koa");
const Router = require("@koa/router");

const main = async () => {
  const app = new Koa();
  const port = process.env.PORT || 8000;

  const router = new Router();

  router.get("/", (ctx, next) => {
    ctx.body = "Hello bub";
    next();
  });

  app.use(router.routes());

  app.listen(port, () => {
    console.log(`now listening on ${port}`);
  });
};

main();
