import { API_URL } from "./env.js";
import { makeGraph } from "./graph.js";

const subtopics = new Promise((resolve, reject) => {
  fetch(`${API_URL}/v1/subtopics/`)
    .then((response) => response.json())
    .then((json) => {
      resolve(json);
    })
    .catch(() => reject());
});

const setSubtopic = async (app, id) => {
  const response = await fetch(`${API_URL}/v1/subtopics/${id}?byYear&byPhase`);
  const subtopic = await response.json();

  app.view = "single_subtopic";
  app.subtopic = subtopic.pop();
  window.scrollTo(0, 0);

  const graphOptions = {
    height: 300,
    width: 400,
    margin: { bottom: 20, left: 30, right: 0, top: 10 },
  };

  setTimeout(() => {
    app.subtopic.phases.forEach((phase) => {
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
    }, 1);
  });
};

export { setSubtopic, subtopics };
