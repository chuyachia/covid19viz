import {format} from 'd3-format';
import {axisBottom} from 'd3-axis';

export const xAxis = () => {

  return {
    setXAxis: function ({ scale, tickNumber, label }) {
      const margin = this.getMargin ? this.getMargin().bottom / 2 : 0;

      if (!this.getCanvas || ! this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before setting axis');
      }
      const svg = this.getCanvas();
      const xAxis = axisBottom(scale);
      if (tickNumber) {
        xAxis.ticks(tickNumber);
      }

      const axis = svg.append('g')
        .attr('class','x-axis')
        .attr('transform', 'translate(0,' + this.getCanvasHeight() + ')')
        .call(xAxis);

      if (label) {
        svg.append('text')
          .attr('transform', 'translate(' + (this.getCanvasWidth() / 2) + ' ,' +
            (this.getCanvasHeight() + margin) + ')')
          .style('text-anchor', 'middle')
          .text(label);
      }

      return axis;
    },
    updateXAxis: function ({ scale, tickNumber, label }) {
      if (!this.getCanvas || !this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before setting axis');
      }
      const svg = this.getCanvas();
      const xAxis = axisBottom(scale);
      if (tickNumber) {
        xAxis.ticks(tickNumber);
      }

      const axis = svg.selectAll('g.x-axis')
        .call(xAxis);

      if (label) {
        svg.selectAll('text.x-axis-text')
          .text(label);
      }

      return axis;
    }
  }
}