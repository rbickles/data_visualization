import * as d3 from "d3";

const width = 500;
const height = 200;
const margins = { top: 20, left: 20, bottom: 20, right: 20 };

export async function renderHoopChart(container) {
  container.innerHTML = `
  <h1>Hoop data</h1>
  <p>This contains data on basketball shots</p>
  <svg id="hoop"></svg>
  `;

  const data = await d3.csv("./src/data/hoop_data.csv", d3.autoType);
  console.log("data", data);

  const hoopRadius = 70;
  const attachmentHeight = 20;
  const scalar = hoopRadius / 0.75;
  const scaleX = width / 2;


  const svg = d3
    .select("#hoop")
    .attr("viewBox", [0, 0, width, height])

  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#202020");

    svg
    .append("rect")
    .attr("x", scaleX - 20)
    .attr("width", 40)
    .attr("height", attachmentHeight)
    .attr("fill", "#EA7B40");

  svg
    .append("circle")
    .attr("cx", scaleX)
    .attr("cy", hoopRadius + attachmentHeight - 2)
    .attr("r", hoopRadius)
    .attr("fill-opacity", 0)
    .attr("stroke", "#EA7B40")
    .attr("stroke-width", "1%");

  svg
    .selectAll("shot")
    .data(data)
    .join(
      (enter) =>
        enter.append("g").each(function (d) {
          const selection = d3.select(this);
          const size = 2;
          const x = d.rim_x * scalar + scaleX;
          const y = (d.rim_y - 4 ) * scalar + attachmentHeight - 2;
          if (d.made_shot) {
            selection
              .append("circle")
              .attr("class", "shot")
              .attr("cx", x)
              .attr("cy", y)
              .attr("r", 3)
              .attr("fill", "green")
              .attr("fill-opacity", 0.5);
          } else {
            selection
              .append("line")
              .attr("x1", x - size)
              .attr("y1", y - size)
              .attr("x2", x + size)
              .attr("y2", y + size)
              .attr("stroke", "#ca4153")
              .attr("stroke-width", 1)
              .attr("stroke-opacity", 0.7);

            selection
              .append("line")
              .attr("x1", x - size)
              .attr("y1", y + size)
              .attr("x2", x + size)
              .attr("y2", y - size)
              .attr("stroke", "#ca4153")
              .attr("stroke-width", 1)
              .attr("stroke-opacity", 0.7);
          }
        }),

      (update) => update,
      (exit) => exit
    );
}
