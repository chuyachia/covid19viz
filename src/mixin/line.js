import {line as d3Line} from 'd3-shape';

export const line = () => {
  return {
    drawLines: function ({ data, x, y, xScale, yScale, size = 1.5, color = 'black' }) {
      if (!this.getGraph || !this.getGraph()) {
        throw new ReferenceError('You need to set graph first before drawing');
      }

      const graph = this.getGraph();
      
      const transition = this.getTransition ? this.getTransition() : undefined;

      const lineFunction = d3Line()
        .x((d, i) => x ? xScale(d[x]) : xScale(i))
        .y(d => yScale(d[y])); 

      const lines = graph
        .selectAll('.line')
        .data(data, function (d) { return d[0].Slug })
        .join(
          enter => enter
            .append('path')
            .attr('class', 'line')
            .attr('d', lineFunction)
            .attr('stroke', color)
            .attr('stroke-width', size),
          update => update
            .call(update => {
              if (transition) {
                return update
                  .transition(transition)
                  .attr('d', lineFunction)
              } else {
                return update
                  .attr('d', lineFunction)
              }
            })
        )

      return lines;
    },
    drawLinesLabel: function ({ data, x, y, label, xScale, yScale, color = 'grey' }) {
      if (!this.getGraph || !this.getGraph()) {
        throw new ReferenceError('You need to set graph first before drawing');
      }
      const graph = this.getGraph();

     const getXData = d =>
        x ? xScale(x) : xScale(d.length)

      const getYData = d => {
        const lastData = d.length > 0 ? d[d.length - 1] : undefined;
        return lastData ? yScale(lastData[y]) : 0
      } 

      const getText = d => d[d.length - 1][label];

      const texts = graph
        .selectAll('.line-label')
        .data(data, function (d) { return d[0].Slug })
        .join(
          enter => enter
            .append('text')
            .attr('class', 'line-label')
            .attr('x', getXData)
            .attr('y', getYData)
            .style('fill', color)
            .text(getText),
          update => update
            .attr('x', getXData)
            .attr('y',getYData)
            .text(getText),
        );

      return texts;
    }
  }
}