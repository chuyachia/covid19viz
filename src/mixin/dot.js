export const dot = () => {

  return {
    drawDots: function ({ data, x, y, xScale, yScale, size = 5, color = 'black'}) {
      if (!this.getGraph || !this.getGraph()) {
        throw new ReferenceError('You need to set graph first before drawing');
      }
      const graph = this.getGraph();

      const transition = this.getTransition ? this.getTransition() : undefined;

      const dot = graph
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
            .call(update => {
              if (transition) {
                return update.transition(transition)
                  .attr('cy', function (d) { return yScale(d[y]); })
              } else {
                return update.attr('cy', function (d) { return yScale(d[y]); })
              }
            }),
          exit => exit.remove() 
        );

      return dot;
    }
  }
}