import { renderBarChart } from './product-category-bar-chart/product-category-bar-chart.js';


const loadPage = (chartType) => {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = ''; // Clear previous content

    if (chartType === 'barChart') {
        renderBarChart(contentDiv);
    } else if (chartType === 'scatterPlot') {
        renderScatterPlot(contentDiv);
    } else if (chartType === 'lineChart') {
        renderLineChart(contentDiv);
    }
};

// Load default page on startup
window.onload = () => loadPage('barChart');
