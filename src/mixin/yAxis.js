import {format} from 'd3-format';
import {axisLeft} from 'd3-axis';

export const yAxis = () => {
  return {
   setYAxis: function(scale, tickNumber) {
      if (!this.getCanvas || !this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before setting axis');
      }
      const svg = this.getCanvas();
      const yAxis = axisLeft(scale)
        .tickFormat(function (d) { return scale.tickFormat(tickNumber, format(',d'))(d) })

      svg.append('g')
        .call(yAxis);
    }
  }
}