import * as d3 from "d3";
import { productSalesData } from "../data/productData.js";


// Set dimensions and margins
const width = 600;
const height = 350;
const margin = { top: 20, right: 30, bottom: 100, left: 40 };

// Calculate the chart's inner dimensions
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// Select the SVG element and set its dimensions
const svg = d3.select("#barChart")
    .attr("width", width)
    .attr("height", height);

// Create a group element for the chart content
const barChart = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Create scales
const x = d3.scaleBand()
    .domain(productSalesData.map(d => d.product))
    .range([0, innerWidth])
    .padding(0.1); // Space between bars

const y = d3.scaleLinear()
    .domain([0, d3.max(productSalesData, d => d.unitsSold)])
    .range([innerHeight, 0]);


// Create and append axes
const xAxis = d3.axisBottom(x);
const yAxis = d3.axisLeft(y);

barChart.append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(xAxis)
    .selectAll("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end")

barChart.append("g")
    .call(yAxis)
    .selectAll("text")
    .attr("class", "axis-label");

// Add bars
barChart.selectAll(".bar")
    .data(productSalesData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.product))
    .attr("y", d => y(d.unitsSold))
    .attr("width", x.bandwidth())
    .attr("height", d => innerHeight - y(d.unitsSold))
    .on("mouseover", function() {
      d3.select(this)
        .classed("bar-hover", true);  // Add the hover class
  })
  .on("mouseout", function() {
      d3.select(this)
        .classed("bar-hover", false); // Remove the hover class
  });
