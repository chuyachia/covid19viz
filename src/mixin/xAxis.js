import {format} from 'd3-format';
import {axisBottom} from 'd3-axis';

export const xAxis = () => {

  return {
    setXAxis: function (scale, tickNumber, labelText) {
      const margin = this.getMargin ? this.getMargin().bottom / 2 : 0;

      if (!this.getCanvas || ! this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before setting axis');
      }
      const svg = this.getCanvas();
      const xAxis = axisBottom(scale)
        .tickFormat(function (d) { return scale.tickFormat(tickNumber, format(',d'))(d) });
      svg.append('g')
        .attr('class','xAxis')
        .attr('transform', 'translate(0,' + this.getCanvasHeight() + ')')
        .call(xAxis);
      
      svg.append('text')
        .attr('transform', 'translate(' + (this.getCanvasWidth() / 2) + ' ,' +
          (this.getCanvasHeight() + margin) + ')')
      .style('text-anchor', 'middle')
      .text(labelText);
    }
  }
}