import {scaleLog} from 'd3-scale';

export const logScale = () => {

  return {
    getLogScale: (domainFrom, domainTo, rangeFrom, rangeTo) => scaleLog()
      .clamp(true)
      .domain([domainFrom, domainTo])
      .range([rangeFrom, rangeTo]),
  }
}