exports.up = async (knex) => {
  await knex.schema.alterTable("contracts", (table) => {
    table
      .integer("start_fy")
      .comment("The federal fiscal year when the contract begins");
  });

  const contracts = await knex("contracts").select("id", "start_date");
  await Promise.all(
    contracts.map(async ({ id, start_date: date }) => {
      if (date == null) {
        return;
      }

      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript dates are 0-indexed

      await knex("contracts")
        .where({ id })
        .update({ start_fy: month < 10 ? year : year + 1 });
    })
  );
};

exports.down = async (knex) =>
  knex.schema.alterTable("contracts", (table) => {
    table.dropColumn("start_fy");
  });
