const fs = require("fs");
const csvParser = require("csv-parse");
const { seed } = require("../shared");

exports.seed = async (knex) => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const parser = csvParser({ bom: true, columns: true });
  const file = fs.createReadStream("./data/seed/development/input.csv");
  file.pipe(parser);

  await seed(knex, parser);
};
