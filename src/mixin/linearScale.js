import {scaleLinear} from 'd3-scale';

export const linearScale = () => {

  return {
    getLinearScale: (domainFrom, domainTo, rangeFrom, rangeTo) => scaleLinear()
      .domain([domainFrom, domainTo])
      .range([rangeFrom, rangeTo]),
  }
}
