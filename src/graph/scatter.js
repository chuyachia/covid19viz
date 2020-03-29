import {margin} from '../mixin/margin';
import {canvas} from '../mixin/canvas';
import {logScale} from'../mixin/logScale';
import {xAxis} from'../mixin/xAxis';
import {yAxis} from'../mixin/yAxis';
import {tooltip} from '../mixin/tooltip';
import { selectAll } from 'd3';

export const scatter = () => {
  const self = {
    drawDots: function ({ data, x, y, xScale, yScale, size = 5, color = 'black'}) {
      if (!this.getCanvas || !this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before drawing');
      }
      const canvas = this.getCanvas();

      const dot = canvas.append('g')
        .selectAll('dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', function (d) { return xScale(d[x]); })
        .attr('cy', function (d) { return yScale(d[y]); })
        .attr('r', size)
        .style('fill', color);

      return dot;
    }
  }

  return Object.assign(
    self,
    margin(),
    canvas(),
    logScale(),
    xAxis(),
    yAxis(),
    tooltip(),
  );
};