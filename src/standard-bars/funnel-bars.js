import * as d3 from "d3";

const width = 600;
const height = 200;
const margins = { top: 20, right: 20, bottom: 20, left: 20 };

export async function renderFunnelBarChart(container) {
  container.innerHTML = `
  <h1>Funnel bars</h1>
  <p>This contains a funnel chart detailing out retention rates between funnel steps</p>
  <svg id="funnelBar"></svg>`;

  const data = await d3.csv("./src/data/ga4_data.csv", d3.autoType);

  const eventOrder = [
    "session_start",
    "view_item",
    "add_to_cart",
    "begin_checkout",
    "purchase",
  ];

  const groupedData = Array.from(
    d3.rollup(
      data,
      (v) => v.length,
      (d) => d.event_name
    ),
    ([key, value]) => ({ key, value })
  ).sort((a, b) => eventOrder.indexOf(a.key) - eventOrder.indexOf(b.key));

  console.log(data);

  const x = d3
    .scaleBand()
    .domain(groupedData.map((d) => d.key))
    .range([0, width])
    .paddingOuter(0.1)
    .paddingInner(0.4);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(groupedData, (d) => +d.value)])
    .range([height - margins.bottom, margins.top]);

  const lineSegments = groupedData
    .slice(0, -1)
    .map((d, i) => {
      return `M${x(d.key) + x.bandwidth() - 0.5},${y(d.value) + 0.5} L${
        x(groupedData[i + 1].key) + 0.5
      },${y(groupedData[i + 1].value) + 0.5} ${
        x(groupedData[i + 1].key) + 0.5
      },${height - margins.bottom} ${x(d.key) + x.bandwidth() - 0.5}, ${
        height - margins.bottom
      }`;
    })
    .join(" ");

  const svg = d3
    .select("#funnelBar")
    .attr("viewBox", [0, 0, width, height])
    

  svg
    .append("path")
    .attr("fill", "#c2e4f8")
    .attr("fill-opacity", 0.5)
    .attr("stroke", "black")
    .attr("stroke-width", "0.2")
    .attr("stroke-opacity", 0.3)
    .attr("d", lineSegments);

  svg
    .append("g")
    .selectAll("rect")
    .data(groupedData, (d) => d.key)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.key))
    .attr("y", (d) => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - margins.bottom - y(+d.value))
    .attr("fill", "steelblue");

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margins.bottom})`)
    .call(d3.axisBottom(x))
    .call(g => g.selectAll("path").remove())
    .call(g => g.selectAll(".tick line").remove())
    .selectAll("text")
    .attr("text-anchor", "middle")
    .style("font-size", "9px");

  svg
    .append("g")
    .selectAll("text")
    .data(groupedData)
    .enter()
    .append("text")
    .attr("transform", (d) => {
      return `translate(${x(d.key) + x.bandwidth() / 2}, ${y(d.value) - 3})`;
    })
    .text((d) => d.value)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px");

  svg
    .append("g")
    .selectAll("text")
    .data(groupedData)
    .enter()
    .append("text")
    .attr("transform", (d) => {
      return `translate(${x(d.key) + ((x.bandwidth() + x.step()) / 2)}, ${
        y(d.value) + 10
      })`;
    })
    .text((d, i) => {
      const fallOff = (groupedData[i + 1]?.value ?? 0) / d.value;
      return `${(fallOff * 100).toFixed(2)}%`;
    })
    .attr("text-anchor", "middle")
    .attr("font-size", "8px")
    .attr("opacity", 0.4);
}
