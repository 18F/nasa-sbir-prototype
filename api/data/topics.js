const db = require("./knex");
const { getAllSubtopicsByTopic } = require("./subtopics");

const getAllTopics = async () => db("topics").select();

const getAllTopicsByFocusArea = async (focusAreaId) => {
  const all = await db("topics").select().where({ focus_area_id: focusAreaId });

  return Promise.all(
    all.map(async (topic) => ({
      ...topic,
      subtopics: await getAllSubtopicsByTopic(topic.id),
    }))
  );
};

module.exports = { getAllTopics, getAllTopicsByFocusArea };
