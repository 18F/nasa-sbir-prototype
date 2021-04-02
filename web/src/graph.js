/* global d3 */

const makeGraph = (
  data = [],
  {
    height = 300,
    margin: { bottom, left, right, top } = {
      bottom: 20,
      left: 30,
      right: 0,
      top: 10,
    },
    width = 400,
  } = {}
) => {
  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(data.map(({ x: v }) => v)))
    .range([left, width - right]);
  const y = d3
    .scaleLinear()
    .domain(
      d3.extent(
        data
          .map(({ y: v }) => v)
          .reduce((all, arr) => [...all, ...arr.map(({ y: v }) => v)], [])
      )
    )
    .range([height - bottom, top]);

  // X axis
  svg.append("g").call((g) =>
    g.attr("transform", `translate(0,${height - bottom})`).call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
        .tickFormat((v) => v)
    )
  );

  // Y axis
  svg
    .append("g")
    .call((g) =>
      g.attr("transform", `translate(${left},0)`).call(d3.axisLeft(y))
    );

  // X-axis grid lines, so you can have a chance of figuring out the stuff
  // in the middle of the graph.
  svg.append("g").call((g) =>
    g
      .attr("transform", `translate(0,${height - bottom})`)
      .attr("class", "grid-line")
      .call(
        d3
          .axisBottom(x)
          .tickFormat("")
          .ticks(data.length - 1)
          .tickSize(-height + bottom + top)
      )
  );

  // Y-axis grid lines, so you can have a chance of figuring out the stuff
  // in the middle of the graph.
  svg.append("g").call((g) =>
    g
      .attr("transform", `translate(${left},0)`)
      .attr("class", "grid-line")
      .call(
        d3
          .axisLeft(y)
          .tickFormat("")
          .ticks(10)
          .tickSizeInner(-width + left + right)
      )
  );

  const graphData = data.map(({ x: xValue, y: yValue }) => ({
    x: xValue,
    y: Array.isArray(yValue) ? yValue : [yValue],
  }));

  if (graphData.length > 0) {
    const graphCount = graphData[0].y.length;

    for (let i = 0; i < graphCount; i += 1) {
      const line = d3
        .line()
        .x(({ x: v }) => x(v))
        .y(({ y: v }) => y(v[i].y));

      const { color } = graphData[0].y[i];

      svg
        .append("path")
        .datum(graphData)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);
    }
  }

  return svg.node();
};

export default { makeGraph };
export { makeGraph };
