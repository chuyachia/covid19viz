import {select} from 'd3-selection';
import transition from 'd3-transition';

export const baseGraph = () => {
  let svg;
  let graphWidth;
  let graphHeight;
  let transition;

  return {
    setGraph: function(width, height, parentId) {
      if (typeof width !== 'number') throw new TypeError('Width must be a number');
      if (typeof height !== 'number') throw new TypeError('Height must be a number');

      const margin = this.getMargin ? this.getMargin() : { top: 0, bottom: 0, left: 0, right: 0 };
      svg = select(`#${parentId}`) 
        .append('svg')
        .attr('class', 'graph')
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform',
          'translate(' + margin.left + ',' + margin.top + ')')
          
      graphWidth = width- margin.left - margin.right;
      graphHeight = height - margin.top - margin.bottom;

      return svg;
    },
    setTransition: (second) => {
      if (svg == undefined) {
        throw new ReferenceError('You need to set graph first before setting transition');
      }

      transition = svg.transition()
        .duration(second)
    },
    getGraph: () => svg,
    getGraphWidth: () => graphWidth,
    getGraphHeight: () => graphHeight,
    getTransition: () => transition,
  }
}