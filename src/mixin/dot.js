export const dot = () => {

  return {
    drawDots: function ({ data, x, y, xScale, yScale, size = 5, color = 'black'}) {
      if (!this.getCanvas || !this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before drawing');
      }
      const canvas = this.getCanvas();

      const dot = canvas
        .selectAll('circle')
        .data(data)
        .join(
          enter => enter
            .append('circle')
            .attr('cx', function (d, i) { return x? xScale(d[x]): xScale(i); })
            .attr('cy', function (d) { return yScale(d[y]); })
            .attr('r', size)
            .style('fill', color),
          update => update
            .attr('cx', function (d, i) { return x? xScale(d[x]): xScale(i); })
            .attr('cy', function (d) { return yScale(d[y]); }),
          exit => exit.remove() 
        )

      return dot;
    }
  }
}