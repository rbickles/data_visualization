import * as d3 from "d3";

const width = 500;
const height = 300;
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

  const svg = d3.select("#hoop").attr("viewBox", [0, 0, width, height]);

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

  //Create 3pt arc

  const startAngle = (11 * Math.PI) / 16;
  const endAngle = (21 * Math.PI) / 16;

  const arc3 = d3
    .arc()
    .innerRadius(247)
    .outerRadius(250)
    .startAngle(startAngle)
    .endAngle(endAngle);

  const createOuterArc3 = (startAngle, endAngle) => {
    return d3
      .arc()
      .innerRadius(252)
      .outerRadius(400)
      .startAngle(startAngle)
      .endAngle(endAngle);
  };
  startAngle + ((endAngle - startAngle) * 2) / 3;

  svg
    .append("g")
    .attr("transform", `translate(${scaleX} 0)`)
    .append("path")
    .attr("d", arc3())
    .attr("fill", "white");

  svg
    .append("rect")
    .attr("x", 42.2)
    .attr("width", 3)
    .attr("height", 139)
    .attr("fill", "white");
  svg
    .append("rect")
    .attr("x", width - 45.3)
    .attr("width", 3)
    .attr("height", 139)
    .attr("fill", "white");

  const arcRegions = [
    {
      id: "region1",
      startAngle: startAngle,
      endAngle: startAngle + (endAngle - startAngle) / 3,
    },
    {
      id: "region2",
      startAngle: startAngle + (endAngle - startAngle) / 3,
      endAngle: startAngle + ((endAngle - startAngle) * 2) / 3,
    },
    {
      id: "region3",
      startAngle: startAngle + ((endAngle - startAngle) * 2) / 3,
      endAngle: endAngle,
    },
  ];

  data.forEach((d) => {
    const x = d.shooter_x * 10 + scaleX; // Use correct shooter_x scaling
    const y = d.shooter_y * 10 + attachmentHeight - 2; // Use correct shooter_y scaling

    // Calculate angle from the hoop to the shooter location
    const shotAngle = Math.atan2(y - hoopRadius, x - scaleX) + 9 * Math.PI / 16;
    console.log(shotAngle, x, y);
    // Assign the correct shooter region
    if (
      shotAngle >= arcRegions[0].startAngle &&
      shotAngle < arcRegions[0].endAngle && 
      d.shot_type === "3PT"
    ) {
      d.shooter_region = "region1";
    } else if (
      shotAngle >= arcRegions[1].startAngle &&
      shotAngle < arcRegions[1].endAngle && 
      d.shot_type === "3PT"
    ) {
      d.shooter_region = "region2";
    } else if (
      shotAngle >= arcRegions[2].startAngle &&
      shotAngle < arcRegions[2].endAngle && 
      d.shot_type === "3PT"
    ) {
      d.shooter_region = "region3";
    } else {
      d.shooter_region = "none"; // Shots that don't fit any arc
    }
  });

  // Append arcs with region IDs
  arcRegions.forEach((region) => {
    svg
      .append("g")
      .attr("transform", `translate(${scaleX}, 0)`)
      .append("path")
      .attr("d", createOuterArc3(region.startAngle, region.endAngle))
      .attr("fill", "#cacac0")
      .attr("stroke", "black")
      .attr("data-region", region.id)
      .on("mouseover", function () {
        const regionID = d3.select(this).attr("data-region");
        d3.select(this).attr("fill", "#5dc16b");

        svg
          .selectAll(".shot")
          .attr("display", (d) =>
            d.shooter_region === regionID ? "visible" : "none"
          );
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "#cacac0");

        svg.selectAll(".shot").attr("display", "visible");
      });
  });

  // Append shots at the rim (rim_x, rim_y) with shooter_region attribute
  svg
    .selectAll("shot")
    .data(data)
    .join(
      (enter) =>
        enter.append("g").each(function (d) {
          const selection = d3.select(this);
          const size = 2;
          const x = d.rim_x * scalar + scaleX; // Use rim_x (where the shot finished)
          const y = (d.rim_y - 4) * scalar + attachmentHeight - 2; // Use rim_y

          if (d.made_shot) {
            selection
              .append("circle")
              .attr("class", "shot")
              .attr("cx", x)
              .attr("cy", y)
              .attr("r", 3)
              .attr("fill", "green")
              .attr("fill-opacity", 0.5)
              .attr("data-region", d.shooter_region);
          } else {
            selection
              .append("line")
              .attr("class", "shot")
              .attr("x1", x - size)
              .attr("y1", y - size)
              .attr("x2", x + size)
              .attr("y2", y + size)
              .attr("stroke", "#ca4153")
              .attr("stroke-width", 1)
              .attr("stroke-opacity", 0.7)
              .attr("data-region", d.shooter_region);

            selection
              .append("line")
              .attr("class", "shot")
              .attr("x1", x - size)
              .attr("y1", y + size)
              .attr("x2", x + size)
              .attr("y2", y - size)
              .attr("stroke", "#ca4153")
              .attr("stroke-width", 1)
              .attr("stroke-opacity", 0.7)
              .attr("data-region", d.shooter_region);
          }
        }),
      (update) => update,
      (exit) => exit.remove()
    );

    /*
  svg
    .selectAll("test")
    .data(data)
    .join(
      (enter) =>
        enter.append("g").each(function (d) {
          const selection = d3.select(this);
          const size = 2;
          const x = d.shooter_x * 10 + scaleX;
          const y = d.shooter_y * 10 + attachmentHeight - 2;

          if (d.made_shot) {
            selection
              .append("circle")
              .attr("class", "test")
              .attr("cx", x)
              .attr("cy", y)
              .attr("r", 3)
              .attr("fill", d.shooter_region === "region1" ? "yellow" : "blue")
              .attr("fill-opacity", 1)
              .attr("data-region", d.shooter_region);
          } else {
            selection
              .append("line")
              .attr("class", "test")
              .attr("x1", x - size)
              .attr("y1", y - size)
              .attr("x2", x + size)
              .attr("y2", y + size)
              .attr(
                "stroke",
                d.shooter_region === "region1" ? "yellow" : "blue"
              )
              .attr("stroke-width", 1)
              .attr("stroke-opacity", 0.7)
              .attr("data-region", d.shooter_region);

            selection
              .append("line")
              .attr("class", "test")
              .attr("x1", x - size)
              .attr("y1", y + size)
              .attr("x2", x + size)
              .attr("y2", y - size)
              .attr(
                "stroke",
                d.shooter_region === "region1" ? "yellow" : "blue"
              )
              .attr("stroke-width", 1)
              .attr("stroke-opacity", 0.7)
              .attr("data-region", d.shooter_region);
          }
        }),
      (update) => update,
      (exit) => exit.remove()
    );
    */
    

}
