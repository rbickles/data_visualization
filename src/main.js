import { renderBarChart } from './product-category-bar-chart/product-category-bar-chart.js';
import { renderRaceChart } from './bar-race/bar-race-chart.js'

const loadPage = (chartType) => {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = ''; // Clear previous content

    if (chartType === 'barChart') {
        renderBarChart(contentDiv);
    } else if (chartType === 'raceChart') {
        renderRaceChart(contentDiv);
    } 
};

window.loadPage = loadPage;
document.addEventListener("DOMContentLoaded", () => loadPage('raceChart'));

