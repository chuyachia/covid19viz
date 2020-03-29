import {line} from 'd3-shape';

import {margin} from '../mixin/margin';
import {canvas} from '../mixin/canvas';
import {logScale} from'../mixin/logScale';
import {linearScale} from'../mixin/linearScale';
import {xAxis} from'../mixin/xAxis';
import {yAxis} from'../mixin/yAxis';
import {tooltip} from '../mixin/tooltip';

export const lineGraph = () => {
  const self = {
    drawLines: function ({ data, xProp, yProp, xScale, yScale, size = 1.5, color = 'black'}) {
      if (!this.getCanvas || !this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before drawing');
      }

      const canvas = this.getCanvas();
      const lineFunction = line()
        .x((d, i) => xProp ? xScale(d[xProp]) : xScale(i))
        .y(d => yScale(d[yProp])); 

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
    }
  }

  return Object.assign(
    self,
    canvas(),
    margin(),
    xAxis(), 
    yAxis(),
    linearScale(),
    logScale(),
    tooltip(),
  )
}