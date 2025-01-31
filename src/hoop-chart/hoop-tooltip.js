export function showTooltip(event, d, tooltip) {
  console.log("testing")
  tooltip.transition()
      .duration(200)
      .style("opacity", 1);

  tooltip.html(`
      <strong>Shot type:</strong> ${d.shot_type}
  `)
  .style("left", (event.pageX + 10) + "px")
  .style("top", (event.pageY - 20) + "px");
}

export function hideTooltip(tooltip) {
  tooltip.transition()
      .duration(500)
      .style("opacity", 0);
}
