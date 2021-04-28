const { getFiscalYear, truncate } = require("./util");

const seed = async (knex, parser) => {
  await truncate(knex);

  const contracts = new Map();
  const firms = [];
  const firmIds = new Map();

  const getTopicAndSubtopic = (proposal) => {
    // Sometimes there's just not a proposal... name... ID... thing.
    if (!proposal) {
      return { topic: null, subtopic: null };
    }

    const [topicPartial, subtopic] = proposal.split("-").shift().split(".");

    const topic =
      topicPartial.length === 3
        ? topicPartial
        : `${topicPartial[0]}0${topicPartial[1]}`;

    return {
      topic,
      subtopic: subtopic ? `${topic}.${subtopic}` : null,
    };
  };

  // eslint-disable-next-line no-restricted-syntax
  for await (const record of parser) {
    const program = record.PROGRAM.trim();

    if (program !== "ICORPS") {
      const { topic, subtopic } = getTopicAndSubtopic(record.PROPOSAL);

      // If this is a new contract, insert it into the database. I think contracts
      // should be unique, but just in case...
      if (record.CONTRACT && !contracts.has(record.CONTRACT)) {
        const id = await knex("contracts")
          .insert({
            contract: record.CONTRACT,
            award_amount: +record.AWARD_AMOUNT.replace(/\D/g, ""),
            start_date: record.STARTDATE || null,
            start_fy: getFiscalYear(record.STARTDATE),
            end_date: record.ENDDATE || null,
            status: record.CONTRACT_STATUS,
          })
          .returning("id");

        contracts.set(record.CONTRACT, id.pop());
      }

      // If this is a new firm... you know the drill!
      const firm = {
        name: record.FIRM_NAME,
        city: record.FIRM_CITY,
        state: record.FIRM_STATE,
      };
      if (
        !firms.some(
          ({ name, city, state }) =>
            name === firm.name && city === firm.city && state === firm.state
        )
      ) {
        const id = await knex("firms")
          .insert({
            ...firm,
          })
          .returning("id");

        firms.push(firm);
        firmIds.set(JSON.stringify(firm), id.pop());
      }

      const contractId = contracts.get(record.CONTRACT);
      const firmId = firmIds.get(JSON.stringify(firm));

      await knex("proposals").insert({
        proposal_id: record.PROPOSAL_ID.trim(),
        topic,
        subtopic,
        proposal: record.PROPOSAL.trim() || null,
        program_year: +record.PROGRAMYEAR,
        program,
        phase: record.PHASE.trim(),
        title: record.PROPOSAL_TITLE.trim(),
        abstract: record.ABSTRACT.trim(),

        contract_id: contractId,
        firm_id: firmId,
      });
    }
  }

  // Link phase 2s and 2+s to their predecessor phase 1s and 2s.
  const phase2s = await knex("proposals")
    .select("id", "phase", "proposal")
    .whereNotNull("proposal")
    .andWhere((builder) => builder.whereNot("phase", "1"));

  await Promise.all(
    phase2s.map(async ({ id, phase, proposal }) => {
      // If this is a phase 2 proposal, the previous phase is 1. Otherwise, the
      // previous phase is phase 2. If this is a phase 3 with a prior 2+, we'll
      // fix that later, after we've built all the associations.
      const previousPhase = phase === "2" ? "1" : "2";

      // A previous phase is associated to this one if it has the same
      // proposal text
      const previousProposal = await knex("proposals")
        .select("id")
        .where({ phase: previousPhase, proposal })
        .first();

      if (previousProposal) {
        await knex("proposals")
          .where({ id })
          .update({ previous_proposal_id: previousProposal.id });
      }
    })
  );

  // Now get the phase 3s so we can link those back to phase 2s.
  // A 3 is related to a phase 2 if it has the same proposal as the phase 2,
  // OR, if the proposal is missing, if the firm has exactly one phase 2
  // proposal for the same program year.
  //
  // ===========================================================================
  // === This logic doesn't hold up. This is commented out for now, but      ===
  // === maybe we can put it back in a modified form at some point. But it   ===
  // === is not this day.                                                    ===
  // ===========================================================================
  //
  // const awardedPhase3s = await knex("proposals")
  //   .select("id", "firm_id", "program_year", "proposal")
  //   .whereNotNull("contract_id")
  //   .andWhere("phase", "3");
  // await Promise.all(
  //   awardedPhase3s.map(
  //     async ({ id, firm_id: firm, program_year: year, proposal }) => {
  //       // If the phase 3 has a proposal text, check for a corresponding phase 2
  //       // first. That's the easiest and best path.
  //       if (proposal) {
  //         const phase2 = await knex("proposals")
  //           .select("id")
  //           .where({ phase: "2", proposal })
  //           .first();

  //         if (phase2) {
  //           return knex("proposals")
  //             .where({ id })
  //             .update({ previous_proposal_id: phase2.id });
  //         }
  //       }

  //       // Otherwise, select all phase 2s from the same firm and the same
  //       // program year.
  //       const possiblePhase2s = await knex("proposals")
  //         .select("id")
  //         .where({ firm_id: firm, phase: "2", program_year: year });

  //       // If there's just one, we have our match.
  //       if (possiblePhase2s.length === 1) {
  //         await knex("proposals")
  //           .where({ id })
  //           .update({ previous_proposal_id: possiblePhase2s[0].id });
  //       }
  //       return Promise.resolve();
  //     }
  //   )
  // );

  // Lastly, we need to update any phase 3s where the previous proposal might
  // ACTUALLY be a phase 2+. But we couldn't do that until the first pass of
  // mappings was finished.
  const phase3s = await knex("proposals")
    .whereNotNull("previous_proposal_id")
    .andWhere({ phase: "3" });
  const phase2Plus = await knex("proposals")
    .whereNotNull("previous_proposal_id")
    .andWhere("phase", "like", "2_");

  // Map phase 2 IDs to the 2+ IDs that they precede.
  const phase2ToPostPhase2Map = phase2Plus.reduce(
    (o, { id, previous_proposal_id: prev }) => ({ ...o, [prev]: id }),
    {}
  );

  await Promise.all(
    phase3s.map(async ({ id, previous_proposal_id: prev }) => {
      // If there is a phase 2 proposal in the mapping with this predecessor ID,
      // then the predecessor is REALLY a 2+. Grab its ID from the map and
      // update the database.
      if (phase2ToPostPhase2Map[prev]) {
        await knex("proposals")
          .where({ id })
          .update({ previous_proposal_id: phase2ToPostPhase2Map[prev] });
      }
    })
  );
};

module.exports = { seed };
