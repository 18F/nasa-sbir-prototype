const {
  subtopics: { getAllSubtopicsByPhaseAndYear },
} = require("../data");

const getTemplateData = async (ctx) => {
  const subtopics = await getAllSubtopicsByPhaseAndYear(ctx.query.id);

  return { id: ctx.query.id, subtopic: subtopics.length ? subtopics[0] : null };
};

module.exports = getTemplateData;
