exports.up = async (knex) => {
  await knex.schema.createTable("firms", (table) => {
    table.comment("Firms that have submitted proposals");
    table.increments("id");
    table.text("name").comment("Name of the firm");
    table.text("city").comment("City where the firm resides");
    table
      .string("state", 2)
      .comment("Two-letter state code where the firm resides");
  });

  await knex.schema.createTable("contracts", (table) => {
    table.comment("Contracts awarded to SBIR/STTR proposals");
    table.increments("id");
    table.text("contract").comment("The SBIR contract ID");
    table
      .integer("award_amount")
      .comment("The contract award amount, in whole dollars");
    table.date("start_date");
    table.date("end_date");
    table.text("status").comment("Current contract status");
  });

  await knex.schema.createTable("proposals", (table) => {
    table.comment("All SBIR/STTR proposals");
    table.increments("id");
    table.text("topic").comment("SBIR topic for the proposal");
    table.text("subtopic").comment("SBIR subtopic");
    table.text("proposal_id").comment("Proposal ID carried over from EHB");
    table.text("proposal").comment("Additional proposal identifer from EHB");
    table
      .integer("program_year", 4)
      .comment("Program year the proposal was submitted");
    table.text("program").comment("Program the proposal was submitted to");
    table
      .text("phase")
      .comment("SBIR/STTR phase the proposal was submitted to");
    table
      .integer("firm_id")
      .comment("ID of the firm that submitted the proposal");
    table.text("title").comment("Proposal title");
    table.text("abstract").comment("Proposal abstract");
    table
      .integer("contract_id")
      .comment(
        "If the proposal was awarded, the ID of the associated contract"
      );
    table
      .integer("previous_proposal_id")
      .default(null)
      .comment(
        "If this proposal is *NOT* phase 1, the ID of the proposal from the previous phase"
      );

    table.foreign("firm_id").references("firms.id");
    table.foreign("contract_id").references("contracts.id");
    table.foreign("previous_proposal_id").references("proposals.id");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("firm");
};
