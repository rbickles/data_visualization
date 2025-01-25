import { renderBarChart } from './product-category-bar-chart/product-category-bar-chart.js';
import { renderRaceChart } from './bar-race/bar-race-chart.js'
import { renderRaceChart2 } from './bar-race/bar-race-chart2.js'

const loadPage = (chartType) => {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = ''; // Clear previous content

    if (chartType === 'barChart') {
        renderBarChart(contentDiv);
    } else if (chartType === 'raceChart') {
        renderRaceChart(contentDiv);
    } else if (chartType === 'raceChart2') {
      renderRaceChart2(contentDiv);
  }
};

window.loadPage = loadPage;
document.addEventListener("DOMContentLoaded", () => loadPage('raceChart2'));

