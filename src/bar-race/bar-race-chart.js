import * as d3 from "d3"
import { sortData } from "../data/sortData";
import { fetchCsvData } from "../data/get-data";


//* Render chart function
export function renderRaceChart(container) {
  container.innerHTML =
    `
    <h1>Racing Bar Chart</h1>
      <p>
        Racing bar chart of Poultry consuption per capita per year
      </p>
    <svg id="raceChart" width="600" height="500"></svg>
  `

  const width = 800;
  const height = 300;
  const margins = { top: 20, right: 20, bottom: 20, left: 100 }

  const svg = d3.select("#raceChart")
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', width)
    .attr('height', height)
    .style("border", "1px solid black")

  //* Fetch the data 
  fetchCsvData('./src/data/meatConsumptionPerCapita.csv')
    .then(data => {
      if (Array.isArray(data)) {
        const sortedData = sortData(data)

        drawChart(svg, sortedData, width, height, margins)
      } else {
        console.error("Error: Data is not an array", data);
      }
    })
    .catch(error => console.error("Error processing CSV:", error));

}

//* Draw Chart
function drawChart(svg, data, width, height, margins) {

  const innerHeight = height - margins.top - margins.bottom;
  const innerWidth = width - margins.left - margins.right;
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  async function yearlyAnimation() {

    //maxx range for data is 1961-2021
    for (let year = 1961; year <= 2021; year++) {

      const yearlyData = data.filter(row => row.Year === year).slice(0, 10)
      console.log("year is: ", year, yearlyData)

      const y = d3.scaleBand()
        .domain(yearlyData.map(d => d.Entity))  // Use entity names for the y-axis
        .range([0, height])
        .padding(0.1);

      const x = d3.scaleLinear()
        .domain([0, d3.max(yearlyData, d => d.Poultry)])  
        .range([0, innerWidth]);

      svg.selectAll(".racing-bar")
        .data(yearlyData, d => d.Entity)
        .join(
          enter => enter.append("rect")
            .attr("class", "racing-bar")
            
            .attr("y", height)
            .attr("x", 5)
            .transition()
            .delay(500)
            .duration(500)
            .attr("fill-opacity", 1)
            .attr("y", d => y(d.Entity))
            .attr("x", 5)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.Poultry))
            .attr("fill", d => colorScale(d.Entity)),
          update => update
            .transition()
            .delay(500)
            .duration(500)
            .attr("y", d => y(d.Entity))
            .attr("x", 5)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.Poultry))
            .attr("fill", d => colorScale(d.Entity)),
          exit => exit
            .transition()
            .delay(500)
            .duration(500)
            .attr("fill-opacity", 0)
            .attr("y", height)
            .on("end", function () { d3.select(this).remove(); })
        );

      /*
      svg.selectAll(".x-axis")
        .data(yearlyData, d => d.Entity)
        .join(
          enter => enter.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(5, ${innerHeight})`)
            .transition()
            .delay(500)
            .duration(500)
            .attr("fill-opacity", 1)
            .call(d3.axisBottom(x).ticks(3)),
          update => update
            .attr("class", "x-axis")
            .attr("transform", `translate(5, ${innerHeight})`)
            .transition()
            .delay(500)
            .duration(500)
            .call(d3.axisBottom(x).ticks(3)),
          exit => exit
            .transition()
            .delay(500)
            .duration(500)
            .attr("fill-opacity", 0)
            .remove()
        )
      */

      svg.selectAll(".bar-label")
        .data(yearlyData, d => d.Entity)
        .join(
          enter => enter.append("text")
            .attr("class", "bar-label")
            .attr("fill-opacity", 0)
            .attr("y", height)
            .attr("x", d => x(d.Poultry) - 30)
            .attr("fill", "#333")
            .attr("font-size", "12px")
            .attr("text-anchor", "start")
            .style("font-weight", "bold")
            .text(d => `${d.Poultry.toFixed(2)}\u00A0\u00A0\u00A0\u00A0${d.Entity}`)
            .transition()
            .delay(500)
            .duration(500)
            .attr("fill-opacity", 1)
            .attr("y", d => y(d.Entity) + y.bandwidth() / 2 + 5)
            .tween("text", function (d) {
              const node = d3.select(this);
              const i = d3.interpolateNumber(0, d.Poultry);  // Animate from 0 to final value
              return function (t) {
                node.text(`${i(t).toFixed(2)}\u00A0\u00A0\u00A0\u00A0${d.Entity}`);
              };
            }),

          update => update
            .transition()
            .delay(500)
            .duration(500)
            .attr("y", d => y(d.Entity) + y.bandwidth() / 2 + 5)
            .attr("x", d => x(d.Poultry) - 30)
            .tween("text", function (d) {
              const node = d3.select(this);
              const currentValue = parseFloat(node.text().split("\u00A0")[0]) || 0;
              const i = d3.interpolateNumber(currentValue, d.Poultry);
              return function (t) {
                node.text(`${i(t).toFixed(2)}\u00A0\u00A0\u00A0\u00A0${d.Entity}`);
              };
            }),

          exit => exit
            .transition()
            .delay(500)
            .duration(500)
            .attr("fill-opacity", 0)
            .attr("y", height)
            .on("end", function () { d3.select(this).remove(); })
        );


      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }
  yearlyAnimation();
}