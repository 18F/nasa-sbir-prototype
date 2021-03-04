const db = require("./knex");
const { getAllTopicsByFocusArea } = require("./topics");

const getAllFocusAreas = async () => {
  const all = await db("focus_areas").select();
  return Promise.all(
    all.map(async (focusArea) => ({
      ...focusArea,
      topics: await getAllTopicsByFocusArea(focusArea.id),
    }))
  );
};

const getFocusAreasByYear = async (year) => {};

module.exports = { getAllFocusAreas };
