const knex = require("./knex");
const firms = require("./firms");
const proposals = require("./proposals");
const subtopics = require("./subtopics");
const topics = require("./topics");

module.exports = { raw: knex, firms, proposals, subtopics, topics };
