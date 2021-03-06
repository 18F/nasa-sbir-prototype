const getFiscalYear = (dateString) => {
  if (dateString) {
    const date = new Date(Date.parse(dateString));
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return month < 10 ? year : year + 1;
  }
  return null;
};

const truncate = async (knex) => {
  await knex("proposals").del();
  // These need to be deleted in a particular order to handle
  // relationships between them, otherwise we get a key
  // constraint violation.

  await knex("firms").del();
  await knex("contracts").del();

  // Reset increment
  await knex.raw("ALTER SEQUENCE proposals_id_seq RESTART WITH 1");
  await knex.raw("ALTER SEQUENCE firms_id_seq RESTART WITH 1");
  await knex.raw("ALTER SEQUENCE contracts_id_seq RESTART WITH 1");
};

module.exports = { getFiscalYear, truncate };
