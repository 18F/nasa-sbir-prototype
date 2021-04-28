import { API_URL } from "../env.js";

const data = { graphData: [] };

Vue.component("firms", async (resolve) => {
  const response = await fetch("firms/firms.html");
  resolve({
    data: () => data,
    props: ["show"],
    template: await response.text(),
  });
});

const loadFirms = async () => {
  if (data.graphData.length === 0) {
    const response = await fetch(`${API_URL}/v1/firms/`);
    const firms = await response.json();

    data.graphData = firms.data.map(({ phase1, phase2 }) => ({
      x: phase1.proposals,
      y: [phase2.awards, phase1.awards],
    }));
    // .filter(({ y }) => y !== null && y <= 1);

    const distinctX = Array.from(
      new Set(
        data.graphData
          .map(({ x }) => x)
          .sort((a, b) => {
            if (+a > +b) {
              return 1;
            }
            if (+b > +a) {
              return -1;
            }
            return 0;
          })
      )
    );
    data.graphData = distinctX
      .reduce(
        (o, x) => [
          ...o,
          {
            x,
            c: data.graphData.filter(({ x: v }) => v === x).length,
            y: data.graphData
              .filter(({ x: v }) => v === x)
              .map(({ y }) => y)
              .reduce(([p2sum, p1sum], [p2, p1]) => [p2sum + p2, p1sum + p1], [
                0,
                0,
              ])
              .reduce((_, __, ___, [p2, p1]) => {
                return p2 / p1;
              }),
          },
        ],
        []
      )
      .filter(({ y }) => y <= 1);
  }

  const height = 300;
  const bottom = 20;
  const left = 30;
  const right = 30;
  const top = 10;
  const width = 400;

  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(data.graphData, ({ x: v }) => v))
    .range([left, width - right]);
  const y = d3
    .scaleLinear()
    .domain(d3.extent(data.graphData, ({ y: v }) => v))
    .range([height - bottom, top]);
  const c = d3
    .scaleLog()
    .domain(d3.extent(data.graphData, ({ c: v }) => v))
    .range([1, 6]);

  // X axis
  svg
    .append("g")
    .call((g) =>
      g
        .attr("transform", `translate(0,${height - bottom})`)
        .call(d3.axisBottom(x).tickFormat((v) => v))
    );

  // Y axis
  svg
    .append("g")
    .call((g) =>
      g.attr("transform", `translate(${left},0)`).call(d3.axisLeft(y))
    );

  svg
    .append("g")
    .selectAll()
    .data(data.graphData)
    .enter()
    .append("circle")
    .attr("cx", ({ x: v }) => x(v))
    .attr("cy", ({ y: v }) => y(v))
    .attr("r", ({ c: v }) => c(v));

  document.getElementById("firms-graph").append(svg.node());
};

export { loadFirms };
