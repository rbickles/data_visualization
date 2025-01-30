import * as d3 from "d3";

const width = 960;
//const height = 100;
const margins = { top: 20, right: 20, bottom: 20, left: 100 };

export async function renderTreeChart(container) {
  container.innerHTML = `
    <h1> Tree Chart</h1>
    <p> You can expand this tree to view average selling price of cars</p>
    <svg id="tree"></svg>
  `;

  const data = await d3.csv("./src/data/car_price_dataset.csv", d3.autoType);
  console.log("data: ", data);

  function mapToHierarchy(map) {
    if (!(map instanceof Map)) return map; 

    return Array.from(map, ([key, value]) => ({
      name: key, 
      children: mapToHierarchy(value),
    }));
  }

  const groupings = ["Brand", "Model", "Transmission"];
  const metric = "Price";
  const groupedData = d3.rollup(
    data,
    (group) => d3.mean(group, (d) => parseFloat(d[metric])),
    ...groupings.map((key) => (d) => d[key])
  );
  const root = d3.hierarchy({ name: "Cars", children: mapToHierarchy(groupedData) });
  root.each((node, i) => {
    node.id = i;
  });
  const dx = 20;
  const dy = (width - margins.right - margins.left) / (2 + root.height);
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
    tree(root);

    const duration = event?.altKey ? 2500 : 250;
    const nodes = root.descendants().reverse();
    const links = root.links();

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
        d.children = d.children ? null : d._children;
        update(event, d);
      });

    const rectWidth = 80
    const rectHeight = 17

    nodeEnter
      .append("rect")
      .attr("y", -9)
      .attr("x", -30)
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("fill", "#e6f4f0")
      .attr("stroke", "#1abc9d")
      .attr("opacity", d => d._children ? 1 : 0)
      .attr("stroke-width", 1);

    nodeEnter
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d._children ? 10 : 0)
      .attr("text-anchor", d => d._children ? "middle" : "start")
      .text((d) => d._children ? d.data.name : `${d.data.name} avg. sell price: (${d.data.children.toFixed(2)})`)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white")
      .attr("paint-order", "stroke")
      .attr("fill", d => d._children ? "black" : "#3498db");



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

    const link = gLink.selectAll("path").data(links, (d) => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .append("path")
      .attr("stroke-width", .5)
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

  root.x0 = dy / 2;
  root.y0 = 0;
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    if (d.depth && d.data.name !== "Kia") d.children = null;
  });

  update(null, root);

  return svg.node();
}
