import * as d3 from "d3";

const width = 960;
//const height = 100;
const margins = { top: 20, right: 20, bottom: 20, left: 20 };

export async function renderTreeChart(container) {
  container.innerHTML = `
    <h1> Tree Chart</h1>
    <p> You can expand this tree to view car pricing</p>
    <svg id="tree"></svg>
  `;

  const data = await d3.csv("./src/data/car_price_dataset.csv", d3.autoType);
  console.log("data: ", data);

  const groupings = ["Brand", "Model", "Transmission"];
  const metric = "Price";
  const groupedData = d3.rollup(
    data,
    (group) => d3.mean(group, (d) => parseFloat(d[metric])),
    ...groupings.map((key) => (d) => d[key])
  );
  const root = d3.hierarchy(groupedData);
  root.each((node, i) => {
    node.id = i; // Assign a unique ID to each node
  });
  const dx = 10;
  const dy = (width - margins.right - margins.left) / (1 + root.height);
  console.log("root: ", root);

  const tree = d3.tree().nodeSize([dx, dy]);
  const diagonal = d3
    .linkHorizontal()
    .x((d) => d.y)
    .y((d) => d.x);


  const svg = d3
    .select("#tree")
    .attr("viewBox", [-margins.left, -margins.top, width, dx])
    .attr(
      "style",
      "max-width: 100%; height: auto; font: 10px sans-serif; user-select: none;"
    )
    .style("border", "solid 1px black");

  const gLink = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

  const gNode = svg
    .append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

  //* Helper functions
  const update = function (event, source) {
    const duration = event?.altKey ? 2500 : 250;
    const nodes = root.descendants().reverse();
    const links = root.links();

    tree(root);

    let left = root;
    let right = root;
    root.eachBefore((node) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + margins.top + margins.bottom;

    const transition = svg
      .transition()
      .duration(duration)
      .attr("height", height)
      .attr("viewBox", [-margins.left, left.x - margins.top, width, height])
      .tween(
        "resize",
        window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
      );

    //Update nodes
    const node = gNode.selectAll("g").data(nodes, (d) => d.id);

    const nodeEnter = node
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("click", (event, d) => {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(event, d);
      });

    nodeEnter
      .append("circle")
      .attr("r", 2.5)
      .attr("fill", (d) => (d._children ? "#555" : "#999"))
      .attr("stroke-width", 10);

    nodeEnter
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", (d) => (d.children ? -6 : 6))
      .attr("text-anchor", (d) => (d.children ? "end" : "start"))
      .text((d) => d.data[0])
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white")
      .attr("paint-order", "stroke");

    // Transition nodes to their new position.
    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", (d) => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    // Update the links…
    const link = gLink.selectAll("path").data(links, (d) => d.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", (d) => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      });

    // Transition links to their new position.
    link.merge(linkEnter).transition(transition).attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", (d) => {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      });

    // Stash the old positions for transition.
    root.eachBefore((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  };

  root.descendants().forEach((d) => {
    if (d.depth > 0) {
      d._children = d.children;
      d.children = null;
    }
  });

  update(null, root);
}
