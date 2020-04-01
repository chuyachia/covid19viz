import {scaleSymlog} from 'd3-scale';

export const logScale = () => {

  return {
    getLogScale: (domainFrom, domainTo, rangeFrom, rangeTo, constant = 1) => scaleSymlog()
      .domain([domainFrom, domainTo])
      .range([rangeFrom, rangeTo])
      .constant(constant)
      .nice(),
  }
}