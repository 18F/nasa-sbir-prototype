const focusAreas = require("./focusAreas");
const knex = require("./knex");
const subtopics = require("./subtopics");
const topics = require("./topics");

module.exports = { focusAreas, raw: knex, subtopics, topics };
