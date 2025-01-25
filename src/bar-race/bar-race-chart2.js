import * as d3 from 'd3'


const duration = 250;
const barCount = 10;
const k = 10;
const barSize = 40;

const margins = { top: 20, right: 20, bottom: 20, left: 20 };
const width = 600;
const height = margins.top + barSize * barCount + margins.bottom;

let color;


export async function renderRaceChart2(container) {
  container.innerHTML = `
    <h1>Racing Bar Chart</h1>
    <p>
      This chart shows the top meat consumption trends over time.
    </p>
    <svg id="raceChart2"></svg>
  `;

  const data = await d3.csv("./src/data/meatConsumptionPerCapita.csv", d3.autoType)
  console.log("CSV Data Loaded here:", data);

  //* data formatting
  const groupData = d3.group(data, d => d.Entity);
  const Entities = new Set(data.map(d => d.Entity));
  const dateValues = Array.from(d3.rollup(data, ([d]) => d.Beef, d => d.Year, d => d.Entity))
    .map(([Year, data]) => [new Date(Year, 0, 1), data])
    .sort(([a], [b]) => d3.ascending(a, b))


  const keyframes = [];
  let ka, a, kb, b;
  for ([[ka, a], [kb, b]] of d3.pairs(dateValues)) {
    for (let i = 0; i < k; ++i) {
      const t = i / k
      keyframes.push([
        new Date(ka * (1 - t) + kb * t),
        rank((Entity => (a.get(Entity) || 0) * (1 - t) + (b.get(Entity) || 0) * t), Entities, barCount)
      ]);
    }
  }
  keyframes.push([new Date(kb), rank((Entity => b.get(Entity) || 0), Entities, barCount)])


  const nameframes = d3.groups(keyframes.flatMap(([, data]) => data), d => d.Entity);
  const prev = new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])));
  const next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));


  const color = createColorScale(data)
  const x = createXScale(data);
  console.log("x", x.domain())

  const svg = d3.select("#raceChart2")
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style("border", "1px solid black")
  svg.style("opacity", 1);



  const updateBars = bars(svg, prev, next, x, color);

  //yield svg.node();

  for (const keyframe of keyframes) {
    const transition = svg.transition()
      .duration(duration)
      .ease(d3.easeLinear);

    console.log("keyframes", keyframe[1][0].value)
    x.domain([0, keyframe[1][0].value]);
    updateBars(keyframe, transition)

    try {
      await transition.end();
    } catch (error) {
      console.error("Transition interrupted:", error);
    }


  }

  /*
    svg.append("rect")
      .attr("height", 50)
      .attr("width", 100)
      .attr("fill", "steelblue")
  */

  //document.body.appendChild(svg.node());
}

//* FUNCTIONS
//rank function
const rank = function (value, Entities, barCount) {
  const data = Array.from(Entities, Entity => ({ Entity, value: value(Entity) }));
  data.sort((a, b) => d3.descending(a.value, b.value));
  for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(barCount, i);
  return data;
}

//Create color function
const createColorScale = function (data) {
  const scale = d3.scaleOrdinal(d3.schemeTableau10);
  if (data.some(d => d.Entity !== undefined)) {
    const entityByName = new Map(data.map(d => [d.Entity, d.Entity]));
    scale.domain(Array.from(entityByName.values()));
    return d => scale(entityByName.get(d.Entity));
  }
  return d => scale(d.Entity)
}

// Create x and y axis scales
const createXScale = function (data) {
  return d3.scaleLinear()
    .domain([0, 1])
    .range([margins.left, width - margins.right])
}

const y = d3.scaleBand()
  .domain(d3.range(barCount + 1))
  .rangeRound([margins.top, margins.top + barSize * (barCount + 1 + 0.1)])
  .padding(0.1)

//bars function
const bars = function (svg, prev, next, x, color) {
  let bar = svg.append("g")
    .attr("fill-opacity", 0.6)
    .selectAll("rect");

  return ([date, data], transition) => {
    bar = bar
      .data(data.slice(0, barCount), d => d.Entity)
      .join(
        enter => enter.append("rect")
          .attr("fill", color)
          .attr("height", y.bandwidth())
          .attr("x", x(0))
          .attr("y", d => {
            console.log("fixing domain error", x((prev.get(d.Entity) || d).value) - x(0))
            y((prev.get(d.Entity) || d).rank)
          })
          .attr("width", d => x((prev.get(d.Entity) || d).value) - x(0)),
        update => update,
        exit => exit.transition(transition).remove()
          .attr("y", d => y((next.get(d) || d).rank))
          .attr("x", d => x((next.get(d) || d).Beef) - x(0))
      )
      .call(bar => bar.transition(transition)
        .attr("y", d => y(d.rank))
        .attr("width", d => x(d.value) - x(0)));
  }
}


