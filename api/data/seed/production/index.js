const fs = require("fs");
const csvParser = require("csv-parse");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const truncate = async (knex) => {
  await knex("proposals").del();
  // These need to be deleted in a particular order to handle
  // relationships between them, otherwise we get a key
  // constraint violation.

  await knex("firms").del();
  await knex("contracts").del();
};

exports.seed = async (knex) => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  await truncate(knex);

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

  const contracts = new Map();
  const firms = [];
  const firmIds = new Map();

  const getTopicAndSubtopic = (proposal) => {
    // Sometimes there's just not a proposal... name... ID... thing.
    if (!proposal) {
      return { topic: null, subtopic: null };
    }

    const [topicPartial, subtopic] = proposal.split("-").shift().split(".");

    const topic =
      topicPartial.length === 3
        ? topicPartial
        : `${topicPartial[0]}0${topicPartial[1]}`;

    return {
      topic,
      subtopic: subtopic ? `${topic}.${subtopic}` : null,
    };
  };

  // eslint-disable-next-line no-restricted-syntax
  for await (const record of parser) {
    const program = record.PROGRAM.trim();

    if (program !== "ICORPS") {
      const { topic, subtopic } = getTopicAndSubtopic(record.PROPOSAL);

      // If this is a new contract, insert it into the database. I think contracts
      // should be unique, but just in case...
      if (record.CONTRACT && !contracts.has(record.CONTRACT)) {
        const id = await knex("contracts")
          .insert({
            contract: record.CONTRACT,
            award_amount: +record.AWARD_AMOUNT.replace(/\D/g, ""),
            start_date: record.STARTDATE || null,
            end_date: record.ENDDATE || null,
            status: record.CONTRACT_STATUS,
          })
          .returning("id");

        contracts.set(record.CONTRACT, id.pop());
      }

      // If this is a new firm... you know the drill!
      const firm = {
        name: record.FIRM_NAME,
        city: record.FIRM_CITY,
        state: record.FIRM_STATE,
      };
      if (
        !firms.some(
          ({ name, city, state }) =>
            name === firm.name && city === firm.city && state === firm.state
        )
      ) {
        const id = await knex("firms")
          .insert({
            ...firm,
          })
          .returning("id");

        firms.push(firm);
        firmIds.set(JSON.stringify(firm), id.pop());
      }

      const contractId = contracts.get(record.CONTRACT);
      const firmId = firmIds.get(JSON.stringify(firm));

      await knex("proposals").insert({
        proposal_id: record.PROPOSAL_ID.trim(),
        topic,
        subtopic,
        proposal: record.PROPOSAL.trim(),
        program_year: +record.PROGRAMYEAR,
        program,
        phase: record.PHASE.trim(),
        title: record.PROPOSAL_TITLE.trim(),
        abstract: record.ABSTRACT.trim(),

        contract_id: contractId,
        firm_id: firmId,
      });
    }
  }

  client.destroy();
};
