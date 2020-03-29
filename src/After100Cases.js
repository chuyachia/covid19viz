import {select} from 'd3-selection';
import {mouse} from 'd3-selection';

import {addElementUnder} from './util';
import { fetchHistoricalData, fetchSummaryData } from './api';
import { lineGraph } from './graph/line';

export const After100Cases = async function() {
  const defaultColor = 'grey';
  const hightLightColor = 'orange';
  const summaryData = await fetchSummaryData(); 
  const selectedCountries = ['italy', 'spain', 'china', 'us','germany','france'];
  const groupedData = [];
  let maxDataLength = 0;  

  const filterAndGroupData = (data) => {
    var i = 0;
    while (i < data.length && data[i].TotalConfirmed < 100)  {
      i++;
    }
    const filteredData = data.slice(i, data.length);
    groupedData.push(filteredData);
    if (filteredData.length > maxDataLength) {
      maxDataLength = filteredData.length;
    }
  }

  for (let i in selectedCountries) {
    const countryCode = selectedCountries[i];
    let data = [];
    try {
      data = await fetchHistoricalData(countryCode);
    } catch(e) {
      console.error(e);
    }
    filterAndGroupData(data);
  }

  const graphTitle = addElementUnder('h2', { class: 'graph-title' }, {}, 'after-100days-graph-title', 'after-100days');
  graphTitle.innerHTML = 'Growth After 100 Cases';
  const Line = lineGraph();
  Line.setMargin({ top: 10, right: 30, bottom: 60, left: 60 });
  const graph = Line.setCanvas(800, 600, 'after-100days');
  const xScale = Line.getLinearScale(0, maxDataLength, 0, Line.getCanvasWidth());
  Line.setXAxis(xScale, 6, 'Day');
  let yScale = Line.getLinearScale(0, Math.max.apply(Math, summaryData.map(d=> d.TotalConfirmed)), Line.getCanvasHeight(), 0);
  Line.setYAxis(yScale, 6, 'Total Confirmed Cases');
  let lines = Line.drawLines({
    data: groupedData,
    yProp: 'TotalConfirmed',
    xScale,
    yScale,
    color: defaultColor,
    size: 1.5,
  });
  const tooltip = Line.setTooltip({});
  const handleMouseOver = function() {
    tooltip.style('visibility', 'visible');
    select(this)
    .attr('stroke', hightLightColor)
    .attr('stroke-width', 3);
  }

  const handleMouseOut = function() {
    tooltip.style('visibility', 'hidden');
    select(this)
      .attr('stroke', defaultColor)
      .attr('stroke-width', 1.5);
  }

  const handleMouseMove = function (d, i) {
    const day = Math.floor(xScale.invert(mouse(this)[0]));
    const data = d[day];
    tooltip.style('top', (event.pageY + 30) + 'px')
      .style('left', event.pageX + 'px')
      .html(`${data.Country} ${new Date(data.Date).toLocaleDateString()} Confirmed ${data.TotalConfirmed}`)  
  }

  lines.on('mouseover', handleMouseOver)
    .on('mousemove', handleMouseMove)
    .on('mouseout', handleMouseOut);
  

  const radioButtons = [
    { value: 'confirmed', checked: true, label: 'Total Confirmed Cases' },
    { value: 'deaths', checked: false, label: 'Total Deaths' }
  ];
  const radioInputWrap = addElementUnder('div', { }, {}, 'after-100days-radio-input-wrap', 'after-100days');
  radioButtons.forEach(button => {
    const props = { type: 'radio', value: button.value, name: 'lines-selection' };
    if (button.checked) {
      props.checked = true;
    }
    addElementUnder('input', props, {}, '', 'after-100days-radio-input-wrap');
    let label = addElementUnder('label', {}, {}, '', 'after-100days-radio-input-wrap');
    label.innerHTML = button.label;
  })

  radioInputWrap.oninput = function(event) {
    if (event.target.value === 'deaths') {
      yScale = Line.getLinearScale(0, Math.max.apply(Math, summaryData.map(d => d.TotalDeaths)), Line.getCanvasHeight(), 0);
      Line.updateYAxis(yScale);
      lines = Line.drawLines({
        data: groupedData,
        yProp: 'TotalDeaths',
        xScale,
        yScale,
        color: defaultColor,
      });
    } else if (event.target.value === 'confirmed') {
      yScale = Line.getLinearScale(0, Math.max.apply(Math, summaryData.map(d => d.TotalConfirmed)), Line.getCanvasHeight(), 0);
      Line.updateYAxis(yScale);
      lines = Line.drawLines({
        data: groupedData,
        yProp: 'TotalConfirmed',
        xScale,
        yScale,
        color: defaultColor,
      });
    }
  }

  const legendWrap = addElementUnder('div', {}, {}, 'after-100days-legend-wrap', 'after-100days');
  selectedCountries.forEach(c => {
    let legend = addElementUnder('div', { class: 'legend' }, {}, '', 'after-100days-legend-wrap');
    legend.innerHTML = c;
  })
}