import {axisBottom} from 'd3-axis';

export const xAxis = () => {

  return {
    setXAxis: function ({ scale, tickNumber, label }) {
      const margin = this.getMargin ? this.getMargin().bottom / 2 : 0;

      if (!this.getGraph || ! this.getGraph()) {
        throw new ReferenceError('You need to set graph first before setting axis');
      }
      const svg = this.getGraph();
      const xAxis = axisBottom(scale);
      if (tickNumber) {
        xAxis.ticks(tickNumber);
      }

      const axis = svg.append('g')
        .attr('class','x-axis')
        .attr('transform', 'translate(0,' + this.getGraphHeight() + ')')
        .call(xAxis);

      if (label) {
        svg.append('text')
          .attr('transform', 'translate(' + (this.getGraphWidth() / 2) + ' ,' +
            (this.getGraphHeight() + margin) + ')')
          .style('text-anchor', 'middle')
          .text(label);
      }

      return axis;
    },
    updateXAxis: function ({ scale, tickNumber, label }) {
      if (!this.getGraph || !this.getGraph()) {
        throw new ReferenceError('You need to set graph first before setting axis');
      }
      const svg = this.getGraph();
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
   },
    drawLineToXAxis: function ({ scale, x, color = 'grey' }) {
      if (!this.getGraph || !this.getGraph()) {
        throw new ReferenceError('You need to set graph first before setting axis');
      }

      const svg = this.getGraph();
      svg.append('line')
        .attr('class', 'line-to-x-axis')
        .style('stroke', color)
        .style('stroke-dasharray', ('2, 3'))
        .attr('x1', 0)
        .attr('x1', scale(x))
        .attr('y1', 0)
        .attr('x2', scale(x))
        .attr('y2', this.getGraphHeight());

    },
    removeLineToXAxis: function() {
      if (!this.getGraph || !this.getGraph()) {
        throw new ReferenceError('You need to set graph first before setting axis');
      }

      const svg = this.getGraph();
      svg.selectAll('line.line-to-x-axis').remove();
    }
  }
}