import {format} from 'd3-format';
import {axisLeft} from 'd3-axis';

export const yAxis = () => {

  return {
   setYAxis: function(scale, tickNumber, labelText) {
      const margin = this.getMargin ? this.getMargin().left : 0;
      if (!this.getCanvas || !this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before setting axis');
      }
      const svg = this.getCanvas();
      const yAxis = axisLeft(scale)
        .tickFormat(function (d) { return scale.tickFormat(tickNumber, format(',d'))(d) })

      svg.append('g')
        .attr('class','yAxis')
        .call(yAxis);

      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0 - (this.getCanvasHeight() / 2))
        .attr("y", 0 - margin)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(labelText);  
    },
    updateYAxis: function (scale) {
      if (!this.getCanvas || !this.getCanvas()) {
        throw new ReferenceError('You need to set canvas first before setting axis');
      }
      const svg = this.getCanvas();
      const yAxis = axisLeft(scale);
      svg.selectAll('g.yAxis')
        .call(yAxis);
    }
  }
}