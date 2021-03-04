const db = require("./knex");

const attachYears = async (subtopics) =>
  Promise.all(
    subtopics.map(async (subtopic) => ({
      ...subtopic,
      years: (
        await db("subtopic_years")
          .where({ subtopic_id: subtopic.id })
          .select("year")
      ).map(({ year }) => year),
    }))
  );

const getAllSubtopics = async () => attachYears(await db("subtopics").select());

const getAllSubtopicsByTopic = async (topicId) =>
  attachYears(await db("subtopics").select().where({ topic_id: topicId }));

module.exports = { getAllSubtopics, getAllSubtopicsByTopic };
