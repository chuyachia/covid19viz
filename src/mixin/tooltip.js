import {select} from 'd3-selection';

export const tooltip = () => {
  let tooltip;

  return {
    setTooltip: ({ backgroundColor = 'white', opacity = '0.8', color = 'black', visibility = 'hidden' }) => {
      tooltip = select('body')
        .append('div')
        .style('background-color', backgroundColor)
        .style('color', color)
        .style('opacity', opacity)
        .style('position', 'absolute')
        .style('z-index', '10')
        .style('visibility', visibility);

      return tooltip;
    },
    getTooltip: () => tooltip,
  }
}