exports.up = async (knex) => {
  await knex.schema.createTable("focus_area", (table) => {
    table.comment("NASA SBIR focus areas");
    table.increments("id");
    table
      .string("title", 1000)
      .comment("The title for the focus area. Basically a name");
    table.text("description").comment("A longer description of the focus area");
  });

  await knex.schema.createTable("topic", (table) => {
    table.comment("SBIR topic");
    table.increments("id");
    table.integer("focus_area_id");
    table.string("title", 1000).comment("The topic title. Basically a name");
    table.text("description").comment("A longer description of the topic");

    table.foreign("focus_area_id").references("focus_area.id");
  });

  await knex.schema.createTable("subtopic", (table) => {
    table.comment("SBIR subtopic");
    table.increments("id");
    table.integer("topic_id");
    table.string("title", 1000).comment("The subtopic title. Basically a name");
    table.text("description").comment("A longer description of the subtopic");

    table.foreign("topic_id").references("topic.id");
  });

  await knex.schema.createTable("subtopic_year", (table) => {
    table.integer("year", 4).comment("Program year");
    table.integer("subtopic_id");

    table.index(["year", "subtopic_id"]);
    table.foreign("subtopic_id").references("subtopic.id");
  });

  await knex.schema.createTable("sbir_phase", (table) => {
    table.comment("SBIR phases - I, II, III");
    table.increments("id");
    table.text("name").comment("Phase name");
    table.text("description").comment("Phase description");
  });

  await knex.schema.createTable("proposal", (table) => {
    table.comment("SBIR proposal");
    table.increments("id");
    table.integer("phase_id");
    table.integer("subtopic_id");
    table.integer("year", 4).comment("Program year");
    table.string("title", 500).comment("Proposal title");
    table.text("abstract");

    table.foreign("phase_id").references("sbir_phase.id");
    table.foreign("subtopic_id").references("subtopic.id");
  });

  await knex.schema.createTable("review", (table) => {
    table.comment("SBIR proposal review; mutliple reviews per proposal");
    table.increments("id");
    table.integer("proposal_id");

    table.foreign("proposal_id").references("proposal.id");
  });

  await knex.schema.createTable("contract", (table) => {
    table.comment(
      "SBIR contract. If a proposal has a contract, that means it was awarded"
    );
    table.increments("id");
    table.integer("proposal_id");

    table.foreign("proposal_id").references("proposal.id");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("contract");
  await knex.schema.dropTable("review");
  await knex.schema.dropTable("proposal");
  await knex.schema.dropTable("sbir_phase");
  await knex.schema.dropTable("subtopic_year");
  await knex.schema.dropTable("subtopic");
  await knex.schema.dropTable("topic");
  await knex.schema.dropTable("focus_area");
};
