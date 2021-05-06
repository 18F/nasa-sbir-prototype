const db = require("./knex");

const getAwardStats = (proposals) => {
  const awards = proposals.filter(({ contract_id: c }) => !!c).length;
  return {
    awards,
    proposals: proposals.length,
    ratio: awards / proposals.length,
  };
};
const getAllSubtopics = async (subtopicId = false) => {
  const subtopics = subtopicId
    ? [subtopicId]
    : (await db("proposals").distinct("subtopic")).map(
        ({ subtopic }) => subtopic
      );

  const proposals = subtopicId
    ? await db("proposals")
        .where({ subtopic: subtopicId === "null" ? null : subtopicId })
        .select()
    : await db("proposals").select();

  return subtopics.map((id) => ({
    id,
    ...getAwardStats(
      proposals.filter(({ subtopic }) => subtopic === (id === null ? null : id))
    ),
  }));
};

const sortBy = (prop) => ({ [prop]: a }, { [prop]: b }) => {
  if (a > b) {
    return 1;
  }
  if (a < b) {
    return -1;
  }
  return 0;
};

const getAllSubtopicsByYear = async (subtopicId = false) => {
  const subtopics = await getAllSubtopics(subtopicId);

  const years = (await db("proposals").distinct("program_year").select()).map(
    ({ program_year: year }) => year
  );

  await Promise.all(
    subtopics.map(async (subtopic) => {
      const proposals = await db("proposals")
        .where({ subtopic: subtopic.id })
        .select();
      subtopic.years = years.map((year) => ({
        year,
        ...getAwardStats(
          proposals.filter(
            ({ program_year: programYear }) => programYear === year
          )
        ),
      }));

      subtopic.years.sort(sortBy("year"));
    })
  );

  return subtopics;
};

const getAllSubtopicsByPhase = async (subtopicId = false) => {
  const subtopics = await getAllSubtopics(subtopicId);

  const phases = (await db("proposals").distinct("phase").select()).map(
    ({ phase }) => phase
  );

  await Promise.all(
    subtopics.map(async (subtopic) => {
      const proposals = await db("proposals")
        .where({ subtopic: subtopic.id })
        .select();

      subtopic.phases = phases.map((phase) => ({
        phase,
        ...getAwardStats(
          proposals.filter(
            ({ phase: proposalPhase }) => proposalPhase === phase
          )
        ),
      }));

      subtopic.phases.sort(sortBy("phase"));
    })
  );

  return subtopics;
};

const getAllSubtopicsByPhaseAndYear = async (subtopicId = false) => {
  const subtopics = await getAllSubtopics(subtopicId);

  const phases = (await db("proposals").distinct("phase").select()).map(
    ({ phase }) => phase
  );
  const years = (await db("proposals").distinct("program_year").select()).map(
    ({ program_year: year }) => year
  );

  await Promise.all(
    subtopics.map(async (subtopic) => {
      const proposals = await db("proposals")
        .where({ subtopic: subtopic.id === "null" ? null : subtopic.id })
        .select();

      subtopic.phases = phases.map((phase) => {
        const phaseProposals = proposals.filter(
          ({ phase: programPhase }) => phase === programPhase
        );

        const phaseInfo = {
          phase,
          ...getAwardStats(phaseProposals),
          years: years.map((year) => ({
            year,
            ...getAwardStats(
              phaseProposals.filter(
                ({ program_year: programYear }) => year === programYear
              )
            ),
          })),
        };

        phaseInfo.years.sort(sortBy("year"));

        return phaseInfo;
      });

      subtopic.phases.sort(sortBy("phase"));
    })
  );

  return subtopics;
};

const getSubtopicsForYear = async (year) => {
  const subtopics = await db("proposals")
    .distinct("subtopic")
    .where({ program_year: year });

  const data = await Promise.all(
    subtopics.map(async ({ subtopic }) => {
      const proposals = await db("proposals").where({ subtopic }).select();

      const awards = proposals.filter(({ contract_id: c }) => !!c).length;

      return {
        subtopic,
        proposals: proposals.length,
        awards,
        ratio: awards / proposals.length,
      };
    })
  );

  return data;
};

module.exports = {
  getAllSubtopics,
  getAllSubtopicsByPhase,
  getAllSubtopicsByPhaseAndYear,
  getAllSubtopicsByYear,
  getSubtopicsForYear,
};
