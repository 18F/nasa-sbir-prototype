const db = require("./knex");

const getFirm = async (firmId) => db("firms").where({ id: firmId }).first();

const getFirmStatistics = async () => {
  const allProposals = await db("proposals").select();
  const firms = (await db("firms").select("id")).map(({ id }) => id);

  const getStats = (firmProposals, programPhase) => {
    const p = programPhase
      ? firmProposals.filter(({ phase }) => phase === programPhase)
      : firmProposals;

    const proposals = p.length;
    const awards = p.filter(({ contract_id: contract }) => !!contract).length;
    const ratio = awards / proposals;

    return { awards, proposals, ratio };
  };

  const stats = {
    firms: firms.length,
    ...getStats(allProposals),
    phase1: {
      ...getStats(allProposals, "1"),
    },
    phase2: {
      ...getStats(allProposals, "2"),
    },
    phase3: {
      ...getStats(allProposals, "3"),
    },

    data: await Promise.all(
      firms.map(async (id) => {
        const firmProposals = allProposals.filter(
          ({ firm_id: firmId }) => firmId === id
        );

        return {
          ...getStats(firmProposals),
          phase1: {
            ...getStats(firmProposals, "1"),
          },
          phase2: {
            ...getStats(firmProposals, "2"),
          },
          phase3: {
            ...getStats(firmProposals, "3"),
          },
        };
      })
    ),
  };

  return stats;
};

module.exports = { getFirm, getFirmStatistics };
