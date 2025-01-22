import * as d3 from "d3";
import { showTooltip, hideTooltip } from './tooltip.js';
import { productSalesData } from "../data/productData.js";

export function renderBarChart(container) {
  container.innerHTML = 
  `
    <h1>Category-Product drilldown</h1>
      <p>
        Click on a bar in the chart to drill down to product level.
        <br />
        Click in the empty space to drill up and view at category level.
      </p>
    <svg id="barChart" width="600" height="500"></svg>
    <div id="tooltip" style="opacity: 0;"></div>
  `
  


//* Set chart area
const width = 500;
const height = 300;
const margin = { top: 20, right: 20, bottom: 70, left: 40 }
const innerHeight = height - margin.top - margin.bottom;
const innerWidth = width - margin.left - margin.right;

//* Prep data
const categoryTotals = d3.rollup(productSalesData, v => d3.sum(v, d => d.unitsSold), d => d.category)
const sortedCategoryTotals = new Map(
  Array.from(categoryTotals).sort((a, b) => d3.descending(a[1], b[1]))
);

const sortedData = Array.from(sortedCategoryTotals.keys())
  .flatMap(category =>
    productSalesData
      .filter(d => d.category === category)
      .sort((a, b) => d3.descending(a.unitsSold, b.unitsSold))
  );

//console.log("Sorted Data by Category Order and UnitsSold descending:", sortedData);

//* Create chart elements
const svg = d3.select("#barChart")
  .attr("width", width)
  .attr("height", height)
  .style("border", "1px solid black")
  .on("click", (event, d) => {
    if (!d3.select(event.target).classed("bar")) {
      up(svg, d)
    }
  })

const tooltip = d3.select("#tooltip");

const barChart = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`)

const x = d3.scaleBand()
  .domain(sortedData.map(d => d.category))
  .range([0, innerWidth])
  .padding(0.1);

const y = d3.scaleLinear()
  .domain([0, d3.max(sortedCategoryTotals.values())])
  .range([innerHeight, 0])

renderAxis(barChart, x, y, innerHeight)

barChart.selectAll(".bar")
  .data(sortedData, d => d.product)
  .enter()
  .append("rect")
  .attr("class", "bar")
  .attr("x", d => x(d.category))
  .attr("y", (d, i, nodes) => {
    //calculate bar stack heights
    let cumulativeSum = 0;
    for (let j = 0; j < i; j++) {
      if (sortedData[j].category === d.category) {
        cumulativeSum += sortedData[j].unitsSold;
      }
    }
    return y(d.unitsSold + cumulativeSum);
  })
  .attr("width", x.bandwidth())
  .attr("height", d => innerHeight - y(d.unitsSold))
  .on("mouseover", function (event, d) {
    d3.select(this)
      .classed("bar-hover", true);
    showTooltip(event, d, tooltip);
  })
  .on("mouseout", function () {
    d3.select(this)
      .classed("bar-hover", false);
    hideTooltip(tooltip);
  })
  .on("click", (event, d) => down(svg, d));

barChart.selectAll(".label")
  .data(sortedCategoryTotals, d => d.category)
  .enter()
  .append("text")
  .attr("class", "label")
  .attr("x", d => x(d[0]) + x.bandwidth() / 2)
  .attr("y", d => y(d[1]) - 5)
  .attr("text-anchor", "middle")
  .attr("font-size", "14px")
  .attr("fill", "black")
  .text(d => d[1]);

//* Utility functions
const fadeOut = function (svg, d, className, filter = null) {
  let selection = svg.selectAll(className)
    .attr("fill-opacity", 1);
  if (filter) {
    selection = selection.filter(filter);
  }
  selection.transition()
    .duration(500)
    .attr("fill-opacity", 0)
    .on("end", function () {
      d3.select(this).remove();
    });
}

//Drilldown function
const down = function (svg, d) {
  const filteredData = sortedData.filter(item => item.category === d.category)

  fadeOut(svg, d, ".bar", p => p.category !== d.category)
  fadeOut(svg, d, ".label")
  fadeOut(svg, d, ".xAxis")
  fadeOut(svg, d, ".yAxis")

  const x2 = d3.scaleBand()
    .domain(filteredData.map(item => item.product))
    .range([0, innerWidth])
    .padding(0.1);

  const y2 = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => d.unitsSold)])
    .range([innerHeight, 0]);

  renderAxis(barChart, x2, y2, innerHeight)

  barChart.selectAll(".bar")
    .data(filteredData, d => d.product)
    .join(
      enter => enter.append("rect")
        .attr('class', "bar")
        .attr('x', d => x2(d.product))
        .attr('y', d => y2(d.unitsSold))
        .attr('width', x2.bandwidth())
        .attr('height', d => innerHeight - y2(d.unitsSold))
        .attr('fill', "steelblue")
        .attr('opacity', 0)
        .transition()
        .delay(300)
        .duration(800)
        .attr("opacity", 1),

      update => update
        .transition()
        .duration(500)
        .attr('x', d => x2(d.product))
        .attr("width", x2.bandwidth())
        .transition()
        .duration(500)
        .attr('y', d => y2(d.unitsSold))
        .attr("height", d => innerHeight - y2(d.unitsSold)),

      exit => exit
        .transition()
        .duration(500)
        .attr("fill-opacity", 0)
        .remove()
    )

  barChart.selectAll(".label")
    .data(filteredData, d => d.product)
    .join(
      enter => enter.append("text")
        .attr("class", "label")
        .attr("x", d => x2(d.product) + x2.bandwidth() / 2)
        .attr("y", d => y2(d.unitsSold) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "black")
        .style("opacity", 0)
        .transition()
        .delay(700)
        .duration(500)
        .style("opacity", 1)
        .text(d => d.unitsSold),

      update => update
        .transition()
        .duration(600)
        .attr("x", d => x2(d.product) + x2.bandwidth() / 2)
        .attr("y", d => y2(d.unitsSold) - 5)
        .text(d => d.unitsSold),

      exit => exit
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove()
    );


};

//Drillup function
const up = function (svg, d) {
  if (barChart.selectAll(".bar").data().length === 15) {
    return;
  }

  //fadeOut(svg, d, ".bar")
  fadeOut(svg, d, ".label")
  fadeOut(svg, d, ".xAxis")
  fadeOut(svg, d, ".yAxis")

  const x = d3.scaleBand()
    .domain(sortedData.map(d => d.category))
    .range([0, innerWidth])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(sortedCategoryTotals.values())])
    .range([innerHeight, 0]);

  renderAxis(barChart, x, y, innerHeight)

  barChart.selectAll(".bar")
    .data(sortedData, d => d.product)
    .join(
      enter => enter.append("rect")
        .attr('class', "bar")
        .attr('x', d => x(d.category))
        .attr('y', innerHeight)  // Start from bottom
        .attr('width', x.bandwidth())
        .attr('height', 0)  // Start with no height
        .attr('fill', "steelblue")
        .attr('opacity', 0)
        .on("mouseover", function (event, d) {
          d3.select(this)
            .classed("bar-hover", true);
          showTooltip(event, d, tooltip);

        })
        .on("mouseout", function () {
          d3.select(this)
            .classed("bar-hover", false);
          hideTooltip(tooltip);


        })
        .on("click", (event, d) => down(svg, d))
        .transition()
        .delay(700)
        .duration(500)
        .attr("opacity", 1)
        .attr("y", (d, i, nodes) => {
          let cumulativeSum = 0;
          for (let j = 0; j < i; j++) {
            if (sortedData[j].category === d.category) {
              cumulativeSum += sortedData[j].unitsSold;
            }
          }
          return y(d.unitsSold + cumulativeSum);
        })
        .attr("height", d => innerHeight - y(d.unitsSold)),

      update => update
        .on("mouseover", function (event, d) {
          d3.select(this)
            .classed("bar-hover", true);
          showTooltip(event, d, tooltip);

        })
        .on("mouseout", function () {
          d3.select(this)
            .classed("bar-hover", false);
          hideTooltip(tooltip)


        })
        .on("click", (event, d) => down(svg, d))
        .transition()
        .duration(500)
        .attr("y", (d, i, nodes) => {
          let cumulativeSum = 0;
          for (let j = 0; j < i; j++) {
            if (sortedData[j].category === d.category) {
              cumulativeSum += sortedData[j].unitsSold;
            }
          }
          return y(d.unitsSold + cumulativeSum);
        })
        .attr("height", d => innerHeight - y(d.unitsSold))
        .transition()
        .duration(500)
        .attr('x', d => x(d.category))
        .attr("width", x.bandwidth()),

      exit => exit
        .transition()
        .duration(500)
        .attr("fill-opacity", 0)
        .remove()
    );

  barChart.selectAll(".label")
    .data(sortedCategoryTotals, d => d.category)
    .join(
      enter => enter.append("text")
        .attr("class", "label")
        .attr("x", d => x(d[0]) + x.bandwidth() / 2)  // Center text on bar
        .attr("y", innerHeight)  // Start from bottom for animation
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "black")
        .style("opacity", 0)
        .text(d => d[1])  // Ensure text is set before transition
        .transition()
        .delay(500)
        .duration(800)
        .attr("y", d => y(d[1]) - 5)  // Move to correct position
        .style("opacity", 1),

      update => update
        .transition()
        .delay(500)
        .duration(600)
        .attr("x", d => x(d[0]) + x.bandwidth() / 2)
        .attr("y", d => y(d[1]) - 5)
        .text(d => d[1]),  // Ensure text is updated in update selection

      exit => exit
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove()
    );
};


function renderAxis(svg, xScale, yScale, innerHeight) {
  // Render X Axis
  svg.append("g")
    .attr('class', 'xAxis')
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end")
    .attr('opacity', 0)
    .transition()
    .duration(500)
    .attr("opacity", 1);

  // Render Y Axis
  svg.append("g")
    .attr('class', 'yAxis')
    .call(d3.axisLeft(yScale))
    .selectAll("text")
    .attr("class", "axis-label")
    .attr('opacity', 0)
    .transition()
    .duration(500)
    .attr("opacity", 1);
}



}


