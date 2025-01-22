import * as d3 from "d3";
import { productSalesData } from "../data/productData.js";

const width = 500;
const height = 300;
const margin = { top: 20, right: 20, bottom: 70, left: 40 }
const innerHeight = height - margin.top - margin.bottom;
const innerWidth = width - margin.left - margin.right;

//Data Prep
const categoryTotals = d3.rollup(productSalesData, v => d3.sum(v, d => d.unitsSold), d => d.category)

// Step 2: Sort categories by total units sold in descending order
const sortedCategoryTotals = new Map(
  Array.from(categoryTotals).sort((a, b) => d3.descending(a[1], b[1]))
);

const sortedData = Array.from(sortedCategoryTotals.keys())
  .flatMap(category =>
    productSalesData
      .filter(d => d.category === category)  // Filter by category
      .sort((a, b) => d3.descending(a.unitsSold, b.unitsSold))  // Sort within category
  );

console.log("Sorted Data by Category Order and UnitsSold descending:", sortedData);


const svg = d3.select("#barChart2")
  .attr("width", width)
  .attr("height", height)
  .style("border", "1px solid black")
  .on("click", (event, d) => {
    if (!d3.select(event.target).classed("bar")) {
      up(svg, d)
    }
  })


const tooltip = d3.select("#tooltip");

const barChart2 = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`)

const x = d3.scaleBand()
  .domain(sortedData.map(d => d.category))
  .range([0, innerWidth])
  .padding(0.1);

const y = d3.scaleLinear()
  .domain([0, d3.max(sortedCategoryTotals.values())])
  .range([innerHeight, 0])

const xAxis = d3.axisBottom(x)
const yAxis = d3.axisLeft(y)

barChart2.append("g")
  .attr("transform", `translate(0, ${innerHeight})`)
  .call(xAxis)
  .attr('class', 'xAxis')
  .selectAll("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-45)")
  .attr("text-anchor", "end");

barChart2.append("g")
  .call(yAxis)
  .attr('class', 'yAxis')
  .selectAll("text")
  .attr("class", "axis-label");

barChart2.selectAll(".bar")
  .data(sortedData)
  .enter()
  .append("rect")
  .attr("class", "bar")
  .attr("x", d => x(d.category))
  .attr("y", (d, i, nodes) => {
    // Calculate y-position for stacking (accumulate previous heights)
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

    tooltip.transition()
      .duration(200)
      .style("opacity", 1);

    tooltip.html(`
        <strong>Product:</strong> ${d.product} <br/>
        <strong>Category:</strong> ${d.category} <br/>
        <strong>Units Sold:</strong> ${d.unitsSold} <br/>
        <strong>Total Revenue:</strong> $${d.totalRevenue}
    `)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 20) + "px");

  })
  .on("mouseout", function () {
    d3.select(this)
      .classed("bar-hover", false);
    tooltip.transition()
      .duration(500)
      .style("opacity", 0);


  })
  .on("click", (event, d) => down(svg, d));

// Step 1: Add category total labels on top of the bars
barChart2.selectAll(".label")
  .data(sortedCategoryTotals)
  .enter()
  .append("text")
  .attr("class", "label")
  .attr("x", d => x(d[0]) + x.bandwidth() / 2)  // Center text on bar
  .attr("y", d => y(d[1]) - 5)  // Position slightly above the bar
  .attr("text-anchor", "middle")  // Center text alignment
  .attr("font-size", "14px")
  .attr("fill", "black")
  .text(d => d[1]);  // Display the total units sold


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

  const xAxis2 = d3.axisBottom(x2);
  const yAxis2 = d3.axisLeft(y2);

  barChart2.append("g")
    .attr('class', 'xAxis')
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(xAxis2)
    .selectAll("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-45)")  // Rotate for better readability if necessary
    .attr("text-anchor", "end")
    .attr('opacity', 0)
    .transition()
    .duration(500)
    .attr("opacity", 1);

  barChart2.append("g")
    .attr('class', 'yAxis')
    .call(yAxis2)
    .selectAll("text")
    .attr("class", "axis-label")
    .attr('opacity', 0)
    .transition()
    .duration(500)
    .attr("opacity", 1);

  barChart2.selectAll(".bar")
    .data(filteredData)
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
        .duration(1000)
        .attr('x', d => x2(d.product))
        .attr("width", x2.bandwidth())
        .transition()
        .duration(1000)
        .attr('y', d => y2(d.unitsSold))
        .attr("height", d => innerHeight - y2(d.unitsSold)),

      exit => exit
        .transition()
        .duration(500)
        .attr("fill-opacity", 0)
        .remove()
    )

  barChart2.selectAll(".label")
    .data(filteredData)
    .join(
      enter => enter.append("text")
        .attr("class", "label")
        .attr("x", d => x2(d.product) + x2.bandwidth() / 2)  // Center text on bar
        .attr("y", innerHeight)  // Start from bottom for animation
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "black")
        .style("opacity", 0)
        .transition()
        .duration(800)
        .attr("y", d => y2(d.unitsSold) - 5)  // Move to correct position
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


const up = function (svg, d) {
  console.log("up function ran:", svg, d);

  //fadeOut(svg, d, ".bar")
  //fadeOut(svg, d, ".label")
  fadeOut(svg, d, ".xAxis")
  fadeOut(svg, d, ".yAxis")

  const x = d3.scaleBand()
    .domain(sortedData.map(d => d.category))
    .range([0, innerWidth])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(sortedCategoryTotals.values())])
    .range([innerHeight, 0]);

  barChart2.selectAll(".bar")
    .data(sortedData)
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

          tooltip.transition()
            .duration(200)
            .style("opacity", 1);

          tooltip.html(`
              <strong>Product:</strong> ${d.product} <br/>
              <strong>Category:</strong> ${d.category} <br/>
              <strong>Units Sold:</strong> ${d.unitsSold} <br/>
              <strong>Total Revenue:</strong> $${d.totalRevenue}
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");

        })
        .on("mouseout", function () {
          d3.select(this)
            .classed("bar-hover", false);
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);


        })
        .on("click", (event, d) => down(svg, d))
        .transition()
        .delay(300)
        .duration(800)
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

          tooltip.transition()
            .duration(200)
            .style("opacity", 1);

          tooltip.html(`
            <strong>Product:</strong> ${d.product} <br/>
            <strong>Category:</strong> ${d.category} <br/>
            <strong>Units Sold:</strong> ${d.unitsSold} <br/>
            <strong>Total Revenue:</strong> $${d.totalRevenue}
        `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");

        })
        .on("mouseout", function () {
          d3.select(this)
            .classed("bar-hover", false);
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);


        })
        .on("click", (event, d) => down(svg, d))
        .transition()
        .duration(600)
        .attr('x', d => x(d.category))
        .attr("width", x.bandwidth())
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
        .attr("height", d => innerHeight - y(d.unitsSold)),

      exit => exit
        .transition()
        .duration(500)
        .attr("fill-opacity", 0)
        .remove()
    );

    barChart2.selectAll(".label")
    .data(sortedCategoryTotals)
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
        .duration(800)
        .attr("y", d => y(d[1]) - 5)  // Move to correct position
        .style("opacity", 1),
  
      update => update
        .transition()
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
  


  barChart2.append("g")
    .attr('class', 'xAxis')
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end")
    .attr('opacity', 0)
    .transition()
    .duration(500)
    .attr("opacity", 1);

  barChart2.append("g")
    .attr('class', 'yAxis')
    .call(d3.axisLeft(y))
    .selectAll("text")
    .attr("class", "axis-label")
    .attr('opacity', 0)
    .transition()
    .duration(500)
    .attr("opacity", 1);
};






