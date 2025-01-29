import * as d3 from "d3";
import { showTooltip, hideTooltip } from "./sunburst-tooltip";

const width = 500;
const height = 300;
const radius = width / 10;
const margins = { top: 20, left: 20, bottom: 20, right: 20 };

export async function renderSuburstChart(container) {
  container.innerHTML = `
    <h1>Netflix Sunburst</h1>
    <p> Click on the sunburst to drill down into the data</p>
    <svg id="sunburst"></svg>
    <div id="tooltip" style="opacity: 0;"></div>
  `;

  const data = await d3.csv("./src/data/netflix_titles.csv", d3.autoType);

  const hierarchyNames = ["rating", "type", "release_year"];
  const groupedData = d3.group(
    data,
    ...hierarchyNames.map((key) => (d) => d[key])
  );
  //console.log("test2: ", hierarchyNames[0])
  //console.log("get pg 13 movies in 2010: ", groupedData.get("Movie").get("PG-13"))

  const hierarchy = d3
    .hierarchy(transformToDataWithCounts(groupedData, hierarchyNames))
    .sum((d) => d.count)
    .sort((a, b) => b.value - a.value);

  const root = d3
    .partition()
    .size([2 * Math.PI, Math.max(3, hierarchy.height + 1)])(hierarchy);
  root.each((d) => (d.current = d));
  console.log("root => ", root);


  const color = d3.scaleOrdinal(
    d3.quantize(d3.interpolateRainbow, root.children.length + 1)
  );
  const yearColor = d3.scaleOrdinal(d3.schemeTableau10);

  const svg = d3
    .select("#sunburst")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .style("font", "10px sans-serif")
    .attr("style", "max-width: 100%; height: auto");

  const tooltip = d3.select("#tooltip");

  const path = svg
    .append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
    .attr("fill", (d) => {
      if (d.depth === root.height) {
        return yearColor(d.data.name);
      } else {
        while (d.depth > 1) d = d.parent;
        return color(d.data.name);
      }
    })

    .attr("fill-opacity", (d) =>
      arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0
    )
    .attr("pointer-events", (d) => (arcVisible(d.current) ? "auto" : "none"))
    .attr("d", (d) => arc(d.current))
    .on("mouseover", function (event, d) {
      if (d.depth === root.height) {
        d3.select(this).classed("bar-hover", true);
        showTooltip(event, d, tooltip);
      }
    })
    .on("mouseout", function () {
      d3.select(this).classed("bar-hover", false);
      hideTooltip(tooltip);
    });

  path
    .filter((d) => d.children)
    .style("cursor", "pointer")
    .on("click", clicked);

  const format = d3.format(",d");
  path.append("title").text(
    (d) =>
      `${d
        .ancestors()
        .map((d) => d.data.name)
        .reverse()
        .join("/")}\n${format(d.value)}`
  );

  const label = svg
    .append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
    .attr("dy", "0.35em")
    .attr("font-size", (d) => {
      const angularWidth = ((d.x1 - d.x0) * 180) / Math.PI;
      const fontSize = Math.min(Math.max(angularWidth / 10, 7), 18);
      return `${fontSize}px`;
    })
    .attr("fill-opacity", (d) => +labelVisible(d.current))
    .attr("transform", (d) => labelTransform(d.current))
    .text((d) => d.data.name);

  const parent = svg
    .append("circle")
    .datum(root)
    .attr("r", radius)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("click", clicked);

  function clicked(event, p) {
    parent.datum(p.parent || root);

    root.each(
      (d) =>
        (d.target = {
          x0:
            Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) *
            2 *
            Math.PI,
          x1:
            Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) *
            2 *
            Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth),
        })
    );
    const t = svg.transition().duration(event.altKey ? 7500 : 750);

    // Transition the data on all arcs, even the ones that aren’t visible,
    // so that if this transition is interrupted, entering arcs will start
    // the next transition from the desired position.
    path
      .transition(t)
      .tween("data", (d) => {
        const i = d3.interpolate(d.current, d.target);
        return (t) => (d.current = i(t));
      })
      .filter(function (d) {
        return +this.getAttribute("fill-opacity") || arcVisible(d.target);
      })
      .attr("fill-opacity", (d) =>
        arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0
      )
      .attr("pointer-events", (d) => (arcVisible(d.target) ? "auto" : "none"))

      .attrTween("d", (d) => () => arc(d.current));

    label
      .filter(function (d) {
        return +this.getAttribute("fill-opacity") || labelVisible(d.target);
      })
      .transition(t)
      .attr("fill-opacity", (d) => +labelVisible(d.target))
      .attrTween("transform", (d) => () => labelTransform(d.current));
  }
}

//* Helper functions
const transformToDataWithCounts = function (map, hierarchyNames) {
  const children = [];
  map.forEach((value, key) => {
    if (value instanceof Map) {
      const child = transformToDataWithCounts(value, hierarchyNames);
      children.push({
        name: key,
        children: child.children,
      });
    } else {
      children.push({
        name: key,
        children: [],
        count: value.length,
      });
    }
  });
  return {
    name: hierarchyNames[0],
    children,
  };
};

const arc = d3
  .arc()
  .startAngle((d) => d.x0)
  .endAngle((d) => d.x1)
  .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
  .padRadius(radius * 1.5)
  .innerRadius((d) => d.y0 * radius)
  .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

function arcVisible(d) {
  return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
}

function labelVisible(d) {
  return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.05;
}

function labelTransform(d) {
  const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
  const y = ((d.y0 + d.y1) / 2) * radius;
  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}
