import {format} from 'd3-format';
import {axisLeft} from 'd3-axis';

export const yAxis = () => {

  return {
    setYAxis: function ({ scale, tickNumber, label }) {
      const margin = this.getMargin ? this.getMargin().left : 0;
      if (!this.getGraph || !this.getGraph()) {
        throw new ReferenceError('You need to set graph first before setting axis');
      }
      const svg = this.getGraph();
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
          .attr("x", 0 - (this.getGraphHeight() / 2))
          .attr("y", 0 - margin)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text(label);
      }

      return axis;
    },
    updateYAxis: function ({ scale, tickNumber, label }) {
      if (!this.getGraph || !this.getGraph()) {
        throw new ReferenceError('You need to set graph first before setting axis');
      }
      const svg = this.getGraph();
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
    },
    drawLineToYAxis: function ({ scale, y, color = 'grey' }) {
      if (!this.getGraph || !this.getGraph()) {
        throw new ReferenceError('You need to set graph first before setting axis');
      }

      const svg = this.getGraph();
      svg
        .append('line')
        .attr('class', 'line-to-y-axis')
        .style('stroke', color)
        .style('stroke-dasharray', ('2, 3'))
        .attr('x1', 0)
        .attr('y1', scale(y))
        .attr('x2', this.getGraphWidth())
        .attr('y2', scale(y));
    },
    removeLineToYAxis: function() {
      if (!this.getGraph || !this.getGraph()) {
        throw new ReferenceError('You need to set graph first before setting axis');
      }

      const svg = this.getGraph();
      svg.selectAll('line.line-to-y-axis').remove();
    }
  }
}