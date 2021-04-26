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

  const yValues = data
    .map(({ y: v }) => v)
    .reduce((all, arr) => [...all, ...arr.map(({ y: v }) => v)], []);
  const maxY = d3.max(yValues);

  const x = d3
    .scaleBand()
    .domain(data.map(({ x: v }) => v))
    .range([left, width - right]);
  const y = d3
    .scaleLinear()
    .domain(d3.extent(yValues))
    .range([height - bottom, top]);

  // X axis
  svg
    .append("g")
    .call((g) =>
      g
        .attr("transform", `translate(0,${height - bottom})`)
        .call(d3.axisBottom(x).tickFormat((v) => v))
    );

  // Y axis
  const axis = maxY < 15 ? d3.axisLeft(y).ticks(maxY) : d3.axisLeft(y);
  svg
    .append("g")
    .call((g) => g.attr("transform", `translate(${left},0)`).call(axis));

  // X-axis grid lines, so you can have a chance of figuring out the stuff
  // in the middle of the graph.
  svg.append("g").call((g) =>
    g
      .attr("transform", `translate(0,${height - bottom})`)
      .attr("class", "grid-line x")
      .call(
        d3
          .axisBottom(x)
          .tickFormat("")
          .ticks(data.length)
          .tickSize(-height + bottom + top)
      )
  );

  // Y-axis grid lines, so you can have a chance of figuring out the stuff
  // in the middle of the graph.
  const gridLine =
    maxY < 15
      ? d3
          .axisLeft(y)
          .tickFormat("")
          .tickSizeInner(-width + left + right)
          .ticks(maxY)
      : d3
          .axisLeft(y)
          .tickFormat("")
          .tickSizeInner(-width + left + right);
  svg
    .append("g")
    .call((g) =>
      g
        .attr("transform", `translate(${left},0)`)
        .attr("class", "grid-line y")
        .call(gridLine)
    );

  const graphData = data.map(({ x: xValue, y: yValue }) => ({
    x: xValue,
    y: Array.isArray(yValue) ? yValue : [yValue],
  }));

  const barWidth = x.bandwidth() * 0.7;
  const barXOffset = (x.bandwidth() - barWidth) / 2.0;

  if (graphData.length > 0 && maxY > 0) {
    const graphCount = graphData[0].y.length;

    for (let i = 0; i < graphCount; i += 1) {
      const { color } = graphData[0].y[i];

      svg
        .append("g")
        .selectAll(".bar")
        .data(graphData)
        .enter()
        .append("rect")
        .attr("x", ({ x: v }) => x(v) + barXOffset)
        .attr("y", ({ y: v }) => y(v[i].y))
        .attr("width", barWidth * 0.8 ** i)
        .attr("height", ({ y: v }) => height - y(v[i].y) - bottom)
        .attr("fill", color)
        .attr("data-value", ({ y: v }) => v[i].y);
    }
  }

  return svg.node();
};

export default { makeGraph };
export { makeGraph };
