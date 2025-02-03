import * as d3 from "d3";

const width = 600;
const height = 200;
const margins = { top: 20, left: 20, bottom: 50, right: 20 };

export async function renderStandardBarChart(container) {
  container.innerHTML = `
  <h1>Standard bars</h1>
  <p>This contains various standard bar charts</p>
  <svg id="standardBar"></svg>
  `;

  const data = await d3.csv(
    "./src/data/meatConsumptionPerCapita.csv",
    d3.autoType
  );

  const groupData = d3.rollup(
    data,
    (v) => d3.mean(v, (d) => d["Poultry"]),
    (d) => d.Entity
  );

  const groupArray = Array.from(groupData, ([key, value]) => ({ key, value }));
  console.log("data", data);

  const x = d3
    .scaleBand()
    .domain(groupArray.slice(50, 60).map((d) => d.key))
    .range([margins.left, width])
    .padding(0.1);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(groupArray, (d) => +d.value)])
    .range([height - margins.bottom, 0]);

  const svg = d3.select("#standardBar").attr("viewBox", [0, 0, width, height]);

  //* Axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margins.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .attr("text-anchor", "end")
    .style("font-size", "7px");

  svg
    .append("g")
    .attr("transform", `translate(${margins.left}, 0)`)
    .call(
      d3
        .axisLeft(y)
        .tickValues(d3.ticks(...y.domain(), 3))
        .tickSize(-width + margins.left)
    )
    .call((g) => g.select(".domain").remove()) // Remove the axis domain line
    .call((g) => g.selectAll("line").attr("stroke-opacity", 0.1));

  //* Bars
  svg
    .append("g")
    .selectAll("rect")
    .data(groupArray.slice(50, 60), (d) => d.key)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.key))
    .attr("y", (d) => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - margins.bottom - y(+d.value))
    .attr("fill", "steelblue");
}
