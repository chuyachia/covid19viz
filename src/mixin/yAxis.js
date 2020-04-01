import {format} from 'd3-format';
import {axisLeft} from 'd3-axis';

export const yAxis = () => {

  return {
    setYAxis: function ({ scale, tickNumber, label }) {
      const margin = this.getMargin ? this.getMargin().left : 0;
      if (!this.getCanvas || !this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before setting axis');
      }
      const svg = this.getCanvas();
      const yAxis = axisLeft(scale);
      if (tickNumber) {
        yAxis.ticks(tickNumber);
      }
        
      const axis = svg.append('g')
        .attr('class','y-axis')
        .call(yAxis);

      if (label) {
        svg.append("text")
          .attr('class', 'y-axis-text')
          .attr("transform", "rotate(-90)")
          .attr("x", 0 - (this.getCanvasHeight() / 2))
          .attr("y", 0 - margin)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text(label);
      }

      return axis;
    },
    updateYAxis: function ({ scale, tickNumber, label }) {
      if (!this.getCanvas || !this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before setting axis');
      }
      const svg = this.getCanvas();
      const yAxis = axisLeft(scale);
      if (tickNumber) {
        yAxis.ticks(tickNumber);
      }

      const axis = svg.selectAll('g.y-axis')
        .call(yAxis);

      if (label) {
        svg.selectAll('text.y-axis-text')
          .text(label);
      }

      return axis;
    }
  }
}