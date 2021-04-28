const db = require("./knex");

const getContract = async (contractId) =>
  db("contracts").where({ id: contractId }).first();

module.exports = { getContract };
