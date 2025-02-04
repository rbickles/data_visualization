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

  const showSideBar = function (event, data) {
    clearTimeout(hideTimeout);

    const children = data.children;
    console.log("children", children);

    const x = d3
      .scaleBand()
      .domain(children.map((child) => child.data.name))
      .range([(2 * width) / 5 - margins.left, margins.left])
      .padding(0.1);

    /*
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(children, (child) => child.value)])
      .range([height - margins.bottom, margins.top]);
*/
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(children, (child) => +child.value) * 1.05])
      .range([height - margins.bottom, margins.top]);

    const sidebar = svg.select("#sidebarGroup");

    if (sidebar.empty()) {
      svg.append("g").attr("id", "sidebarGroup");
    }

    console.log(
      "working",
      d3.max(children, (child) => child?.value)
    );

    svg
      .select("#sidebarGroup")
      .selectAll("rect")
      .data(children, (d) => d.data.name)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => x(d.data.name))
            .attr("y", (d) => height - y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", (d) => y(d.value) - margins.bottom)
            .attr("fill", "steelblue"),
        (update) => update,
        (exit) => exit.transition().duration(300).attr("opacity", 0).remove()
      );
  };

  const hideSidebar = function () {
    hideTimeout = setTimeout(() => {
      showSideBar(null, { children: [] });
    }, 200);
  };

  const y = d3
    .scaleLinear()
    .domain([0, d3.sum(data, (d) => d.Amount)])
    .range([height - margins.bottom, margins.top]);

  const svg = d3
    .select("#budgetChart")
    .attr("viewBox", [0, 0, width, height])
    .style("border", "1px solid black");

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
    .data(root.children, (d) => d.data.name)
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
      showSideBar(event, d);
    })
    .on("mouseleave", hideSidebar);

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
      showSideBar(event, d);
    })
    .on("mouseleave", hideSidebar);
}
