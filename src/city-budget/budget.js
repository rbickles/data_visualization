import * as d3 from "d3";

const width = 500;
const height = 300;
const margins = { top: 20, right: 20, bottom: 20, left: 20 };
const barWidth = width / 5;

export async function renderBudgetChart(container) {
  container.innerHTML = `
  <h1>Budget expenditures chart</h1>
  <p>This interactive chart contains a data from a city budget.</p>
  <svg id="budgetChart"></svg>`;

  const data = await d3.csv("./src/data/city_budget.csv", d3.autoType);
  console.log("data", data);

  const maxSubCategoryAmount = d3.max(data, (d) => d.Amount);
  let oldValues = [];
  let oldAxis = [];

  const formatData = (data) => {
    let hierarchy = { name: "City Budget", children: [] };
    let categoryMap = {};

    data.forEach((row) => {
      let category = row.Category;
      let subcategory = row.Subcategory;
      let amount = row.Amount;
      if (!categoryMap[category]) {
        categoryMap[category] = { name: category, children: [] };
        hierarchy.children.push(categoryMap[category]);
      }
      categoryMap[category].children.push({
        name: subcategory,
        amount: amount,
      });
    });

    return hierarchy;
  };

  const root = d3.hierarchy(formatData(data)).sum((d) => d.amount || 0);
  console.log("hierarchy complete:", root);

  //! Helper functions
  let hideTimeout;

  const updateSideBar = function (event, data) {
    clearTimeout(hideTimeout);

    const children = data.children.map((child, i) => ({
      ...child,
      id: child.id || i,
    }));
    console.log("called function", children);

    const x = d3
      .scaleBand()
      .domain(children.map((child) => child.id))
      .range([(2 * width) / 5 - margins.left, margins.left])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, maxSubCategoryAmount])
      .range([height - margins.bottom - 63, margins.top]);

    if (svg.select("#sidebarGroup").empty()) {
      svg.append("g").attr("id", "sidebarGroup");
    }

    svg
      .select("#sidebarGroup")
      .selectAll("rect")
      .data(children, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => x(d.id))
            .attr("y", y(0))
            .attr("data-value", (d) => d.value)
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("fill", "steelblue")
            .attr("rx", 5)
            .attr("ry", 5)
            .transition()
            .duration(1000)
            .attr("y", (d) => y(d.value))
            .attr("height", (d) => y(0) - y(d.value)),
        (update) =>
          update
            .transition()
            .duration(1000)
            .attr("y", (d) => y(d.value))
            .attr("height", (d) => y(0) - y(d.value)),
        (exit) => exit.remove()
      );

    svg
      .select("#sidebarGroup")
      .selectAll("text")
      .data(children, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("x", (d) => x(d.id) + x.bandwidth() / 2)
            .attr("y", (d) => y(0))
            .text((d) => d3.format("$.3s")(d.value))
            .attr("data-value", (d) => d.value)
            .attr("font-size", "9px")
            .attr("text-anchor", "middle")
            .transition()
            .duration(1000)
            .attr("y", (d) => y(d.value) - 3)
            .tween("text", function (d) {
              const that = d3.select(this);
              const i = d3.interpolateNumber(0, d.value);
              return function (t) {
                that.text(d3.format("$.3s")(i(t)));
              };
            })
            .on("end", function () {
              oldValues = children.map((d) => d.value);
            }),
        (update) =>
          update
            .transition()
            .duration(1000)
            .attr("y", (d) => y(d.value) - 3)
            .tween("text", function (d) {
              const that = d3.select(this);
              const i = d3.interpolateNumber(
                oldValues[d.id] || 500000,
                d.value
              );
              return function (t) {
                that.text(d3.format("$.3s")(i(t)));
              };
            })
            .on("end", function () {
              oldValues = children.map((d) => d.value);
            }),
        (exit) => exit.remove()
      );

    const xAxis = d3
      .axisBottom(x)
      .tickFormat((d) => children[d].data.name)
      .tickSize(0);

    const arraysEqual = (arr1, arr2) => {
      console.log(arr1.every((val, index) => val === arr2[index]))
      return arr1.every((val, index) => val === arr2[index]); // ✅ Compare each element
    };

    if (!arraysEqual(oldAxis, children.map(d => d.data.name))) {
      const axisGroup = svg
        .select("#sidebarGroup")
        .append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${height - margins.bottom - 60})`)
        .call(xAxis);

      axisGroup.select(".domain").remove();

      axisGroup
        .selectAll("text")
        .attr("font-size", "7px")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-75)")
        .attr("dy", "-0.5em")
        .attr("dx", "-1em")
        .style("opacity", 0)
        .attr("fill", "black")
        .transition()
        .duration(1000)
        .style("opacity", 1);
        oldAxis = children.map(d => d.data.name)
    }
  };

  const y = d3
    .scaleLinear()
    .domain([0, d3.sum(data, (d) => d.Amount)])
    .range([height - margins.bottom, margins.top]);

  const svg = d3.select("#budgetChart").attr("viewBox", [0, 0, width, height]);
  svg
    .append("image")
    .attr("href", "src/images/city.png") // Use "href" instead of "xlink:href"
    .attr("x", width / 2 - barWidth / 2)
    .attr("y", margins.top)
    .attr("width", barWidth)
    .attr("height", height - margins.top - margins.bottom)
    .attr("preserveAspectRatio", "xMidYMid slice");

  let cumulativeHeight = 0;
  const barPadding = 1;

  svg
    .selectAll("rect")
    .data(root.children, (d, i) => d.data.name)
    .enter()
    .append("rect")
    .attr("x", width / 2 - barWidth / 2)
    .attr("y", (d, i) => {
      let yPos = y(cumulativeHeight + d.value);
      cumulativeHeight += d.value + barPadding;
      return yPos;
    })
    .attr("width", barWidth)
    .attr("height", (d) => y(0) - y(d.value) - barPadding)
    .attr("fill", "steelblue")
    .attr("fill-opacity", 0.3)
    .attr("stroke", "white")
    .attr("stroke-width", "2px")
    .on("mouseover", function (event, d) {
      updateSideBar(event, d);
    });

  cumulativeHeight = 0;
  svg
    .append("g")
    .selectAll("text")
    .data(root.children, (d) => d.data.name)
    .enter()
    .append("text")
    .attr("x", width / 2 - barWidth / 2 + 2)
    .attr("y", (d, i) => {
      let yPos = y(cumulativeHeight);
      cumulativeHeight += d.value + barPadding;
      return yPos - 3;
    })
    .text((d) => d3.format("$.3s")(d.value))
    .attr("text-anchor", "start")
    .attr("font-size", "13px")
    .attr("font-weight", "bold")
    .attr("fill", "white")
    .on("mouseover", function (event, d) {
      updateSideBar(event, d);
    });
}
