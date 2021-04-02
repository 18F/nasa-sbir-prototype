const db = require("./knex");

const getAwardStats = (proposals) => {
  const awards = proposals.filter(({ contract_id: c }) => !!c).length;
  return {
    awards,
    proposals: proposals.length,
    ratio: awards / proposals.length,
  };
};

const getAllTopics = async (topicId = false) => {
  const topics = topicId
    ? [topicId]
    : (await db("proposals").distinct("topic")).map(({ topic }) => topic);

  const proposals = topicId
    ? await db("proposals").where({ topic: topicId }).select()
    : await db("proposals").select();

  return topics.reduce((all, programTopic) => {
    return {
      ...all,
      [programTopic]: {
        ...getAwardStats(
          proposals.filter(({ topic }) => topic === programTopic)
        ),
      },
    };
  }, {});
};

module.exports = { getAllTopics };
