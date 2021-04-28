import { API_URL } from "../env.js";
import { makeGraph } from "../graph.js";

const data = { subtopic: null };

Vue.component("subtopic", async (resolve) => {
  const response = await fetch("subtopic/subtopic.html");
  resolve({
    data: () => data,
    props: ["show"],
    template: await response.text(),
  });
});

const squashPostPhaseTwo = (subtopic) => {
  const postPhaseTwos = [];
  for (let i = 0; i < subtopic.phases.length; i += 1) {
    if (subtopic.phases[i].phase.match(/^2.$/)) {
      postPhaseTwos.push(...subtopic.phases.splice(i, 1));
      i -= 1;
    }
  }
  const postPhaseTwo = postPhaseTwos.reduce(
    (o, { awards, proposals, years }) => ({
      ...o,
      awards: o.awards + awards,
      proposals: o.proposals + proposals,
      years: [...o.years, ...years],
    }),
    {
      awards: 0,
      phase: `2+ (${postPhaseTwos.map(({ phase }) => phase).join(", ")})`,
      proposals: 0,
      ratio: 0,
      years: [],
    }
  );

  const postPhaseTwoYears = [];
  new Set(postPhaseTwo.years.map(({ year }) => year)).forEach((year) => {
    const data = postPhaseTwo.years.filter(
      ({ year: proposalYear }) => proposalYear === year
    );

    const combinedYear = data.reduce(
      (o, { awards, proposals }) => ({
        awards: o.awards + awards,
        proposals: o.proposals + proposals,
        ratio: 0,
        year,
      }),
      { awards: 0, proposals: 0 }
    );
    postPhaseTwoYears.push(combinedYear);
  });
  postPhaseTwo.years = postPhaseTwoYears;

  for (let i = 0; i < subtopic.phases.length; i += 1) {
    if (subtopic.phases[i].phase.match(/^3$/)) {
      subtopic.phases.splice(i, 0, postPhaseTwo);
      i += 1;
    }
  }
};

const setSubtopic = async (id) => {
  const response = await fetch(`${API_URL}/v1/subtopics/${id}?byYear&byPhase`);
  const subtopic = (await response.json()).pop();

  squashPostPhaseTwo(subtopic);

  data.subtopic = subtopic;
  window.scrollTo(0, 0);

  const graphOptions = {
    height: 300,
    width: 400,
    margin: { bottom: 20, left: 30, right: 0, top: 10 },
  };

  setTimeout(() => {
    data.subtopic.phases.forEach((phase) => {
      const svg = makeGraph(
        phase.years.map(({ awards, proposals, year }) => ({
          x: year,
          y: [
            { color: "orange", y: proposals },
            { color: "green", y: awards },
          ],
        })),
        graphOptions
      );

      document.getElementById(`graph_phase_${phase.phase}`).append(svg);
    }, 10000);
  });
};

export { setSubtopic };
