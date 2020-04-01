import {select} from 'd3-selection';

export const canvas = () => {
  let svg;
  let canvasWidth;
  let canvasHeight;

  return {
    setCanvas: function(width, height, parentId) {
      if (typeof width !== 'number') throw new TypeError('Width must be a number');
      if (typeof height !== 'number') throw new TypeError('Height must be a number');

      const margin = this.getMargin ? this.getMargin() : { top: 0, bottom: 0, left: 0, right: 0 };
      svg = select(`#${parentId}`) 
        .append('svg')
        .attr('class', 'graph')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform',
          'translate(' + margin.left + ',' + margin.top + ')')
          
      canvasWidth = width- margin.left - margin.right;
      canvasHeight = height - margin.top - margin.bottom;

      return svg;
    },
    getCanvas: () => svg,
    getCanvasWidth: () => canvasWidth,
    getCanvasHeight: () => canvasHeight,
  }
}