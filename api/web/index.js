const nunjucks = require("nunjucks");
const path = require("path");

const main = require("./main");
const subtopic = require("./subtopic");

nunjucks.configure(path.join(__dirname, "templates"));

const renderer = async (ctx, next) => {
  switch (ctx.request.path) {
    case "/":
    case "/index.htm":
    case "/index.html": {
      const data = await main(ctx);
      ctx.body = nunjucks.render("index.njk", data);
      return;
    }

    case "/subtopic":
    case "/subtopic/":
    case "/subtopic/index.html": {
      const data = await subtopic(ctx);
      ctx.body = nunjucks.render("subtopic.njk", data);
      return;
    }
    default:
      await next();
  }
};

module.exports = renderer;
