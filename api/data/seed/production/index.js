const csvParser = require("csv-parse");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { seed } = require("../shared");

exports.seed = async (knex) => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const parser = csvParser({ bom: true, columns: true });

  const client = new S3Client({
    region: process.env.S3_REGION,
  });

  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_DATA_BUCKET,
    Key: process.env.S3_DATA_FILE,
  });

  const s3Object = await client.send(cmd);

  s3Object.Body.pipe(parser);

  await seed(knex, parser);

  client.destroy();
};
