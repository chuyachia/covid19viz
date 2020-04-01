import {line as d3Line} from 'd3-shape';
import { style } from 'd3';

export const line = () => {
  return {
    drawLines: function ({ data, x, y, xScale, yScale, size = 1.5, color = 'black'}) {
      if (!this.getCanvas || !this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before drawing');
      }

      const canvas = this.getCanvas();
      const lineFunction = d3Line()
        .x((d, i) => x ? xScale(d[x]) : xScale(i))
        .y(d => yScale(d[y])); 

      const lines = canvas
        .selectAll('.line')
        .data(data)
        .join(
          enter => enter
            .append('path')
            .attr('class', 'line')
            .attr('d', lineFunction)
            .attr('stroke', color)
            .attr('stroke-width', size),
          update => update
            .attr('d', lineFunction)
        )



      return lines;
    },
    drawLinesLabel: function ({ data, x, y, label, xScale, yScale, color = 'black' }) {
      if (!this.getCanvas || !this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before drawing');
      }
      const canvas = this.getCanvas();

      const texts = canvas
        .selectAll('.line-label')
        .data(data)
        .join(
          enter => enter
            .append('text')
            .attr('class', 'line-label')
            .attr('x', function (d) { return x ? xScale(x) : xScale(d.length) })
            .attr('y', function (d) {
              const lastData = d.length > 0 ? d[d.length - 1] : undefined;
              return lastData ? yScale(lastData[y]) : 0
            })
            .style('fill', color)
            .text(function (d) { return d[d.length - 1][label] }),
          update => update
            .attr('x', function (d) { return x ? xScale(x) : xScale(d.length) })
            .attr('y', function (d) {
              const lastData = d.length > 0 ? d[d.length - 1] : undefined;
              return lastData ? yScale(lastData[y]) : 0
            })
            .style('fill', color)
            .text(function (d) { return d[d.length - 1][label] }),
        );

      return texts;
    }
  }
}