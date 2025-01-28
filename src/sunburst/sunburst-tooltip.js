export function showTooltip(event, d, tooltip) {
  tooltip.transition()
      .duration(200)
      .style("opacity", 1);

  tooltip.html(`
      <strong>Movie count:</strong> ${d.value} <br/>
  `)
  .style("left", (event.pageX + 10) + "px")
  .style("top", (event.pageY - 20) + "px");
}

export function hideTooltip(tooltip) {
  tooltip.transition()
      .duration(500)
      .style("opacity", 0);
}