const knex = require("./knex");
const subtopics = require("./subtopics");
const topics = require("./topics");

module.exports = { raw: knex, subtopics, topics };
