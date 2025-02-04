import { renderBarChart } from './product-category-bar-chart/product-category-bar-chart.js';
import { renderRaceChart } from './bar-race/bar-race-chart.js'
import { renderRaceChart2 } from './bar-race/bar-race-chart2.js'
import { renderSuburstChart } from './sunburst/sunburst.js';
import { renderTreeChart } from './tree/tree.js';
import { renderHoopChart } from './hoop-chart/hoop-chart.js';
import { renderStandardBarChart } from './standard-bars/standard-bar.js';
import { renderFunnelBarChart } from './standard-bars/funnel-bars.js';
import { renderBudgetChart } from './city-budget/budget.js';


const loadPage = (chartType) => {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = ''; // Clear previous content

  if (chartType === 'barChart') {
    renderBarChart(contentDiv);
  } else if (chartType === 'raceChart') {
    renderRaceChart(contentDiv);
  } else if (chartType === 'raceChart2') {
    renderRaceChart2(contentDiv);
  } else if (chartType === 'sunburst') {
    renderSuburstChart(contentDiv)
  } else if (chartType === 'tree') {
    renderTreeChart(contentDiv) 
  } else if (chartType === 'hoop') {
    renderHoopChart(contentDiv)
  } else if (chartType === "standardBar") {
    renderStandardBarChart(contentDiv)
  } else if (chartType === "funnelBar") {
    renderFunnelBarChart(contentDiv)
  } else if (chartType === "budgetChart") {
    renderBudgetChart(contentDiv)
  }
};

window.loadPage = loadPage;
document.addEventListener("DOMContentLoaded", () => loadPage('budgetChart'));

