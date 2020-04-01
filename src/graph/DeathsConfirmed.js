import {select} from 'd3-selection';
import {max} from 'd3-array';

import {margin} from '../mixin/margin';
import {canvas} from '../mixin/canvas';
import {logScale} from'../mixin/logScale';
import {xAxis} from'../mixin/xAxis';
import {yAxis} from'../mixin/yAxis';
import {dot} from '../mixin/dot';
import {tooltip} from '../mixin/tooltip';
import {fetchSummaryData, fetchHistoricalData} from '../api';
import {addElementUnder} from '../util';

export const DeathsConfirmedGraph = async function () {
  const defaultColor = '#20B2AA';
  const hightLightColor = 'orange';
  let summaryData = await fetchSummaryData();
  let currentFocusedIndex;
  let currentFocusedCountry;
  let currentFocusedHistoricalData;

  const getTotalConfirmed = (d) => d.TotalConfirmed;
  const getTotalDeaths = (d) => d.TotalDeaths
  const getDeathsConfirmedText = (data) => (`
      <div class='space-between-text'><span>Confirmed</span><span>${data.TotalConfirmed.toLocaleString()}</span></div>
      <div class='space-between-text'><span>Deaths</span><span>${data.TotalDeaths.toLocaleString()}</span></div>`);

  const setSliderLabel = (data) => {
    const date = new Date(data.Date);
    sliderLabel.innerHTML = `
      <p>${data.Country} in ${date.toLocaleDateString()}</p>
      ${getDeathsConfirmedText(data)}`
  }
  const updateGraph = (data) => {
    dots.data(data)
      .attr('cx', function (d) { return xScale(d.TotalDeaths); })
      .attr('cy', function (d) { return yScale(d.TotalConfirmed); });
  }

  const updateDisplayData = (newData) => {
    const newSummaryData = [...summaryData.slice(0, currentFocusedIndex), newData, ...summaryData.slice(currentFocusedIndex + 1)];
    updateGraph(newSummaryData);
  }

  const setTooltipValue = (d) => {
    tooltipObject.style('top', (event.pageY + 30) + 'px')
      .style('left', event.pageX + 'px')
      .html(`${d.Country} Confirmed ${d.TotalConfirmed.toLocaleString()} Deaths ${d.TotalDeaths.toLocaleString()}`);
  }

  const setHistoricalData = async (d) => {
    if (currentFocusedCountry !== d.Slug) {
      currentFocusedCountry = d.Slug;
      currentFocusedHistoricalData = await fetchHistoricalData(d.Slug);
    }
  }

  const setSlider = () => {
    let lastDateIndex = currentFocusedHistoricalData.length - 1;
    slider.setAttribute('max', lastDateIndex);
    slider.setAttribute('min', 0);
    slider.value = lastDateIndex;
    slider.style.visibility = 'visible';

    const data = currentFocusedHistoricalData[lastDateIndex];
    setSliderLabel(data);
  }

  const highlightDot = (dot) => {
    select(dot)
      .attr('r', 10)
      .style('fill', hightLightColor);
  }

  const removeHighlight = () => {
    graph
      .selectAll('circle')
      .attr('r', 5)
      .style('fill', defaultColor);
  }

  const removeLinesToAxis = () => {
    graph.selectAll('line.hightlight-line').remove();
  }

  const addLinesToAxis = (d) => {
    graph
      .append('line')
      .attr('class', 'hightlight-line')
      .style('stroke', 'grey')
      .style('stroke-dasharray', ('2, 3'))
      .attr('x1', 0)
      .attr('y1', yScale(d.TotalConfirmed))
      .attr('x2', GraphMaker.getCanvasWidth)
      .attr('y2', yScale(d.TotalConfirmed));

    graph.append('line')
      .attr('class', 'hightlight-line')
      .style('stroke', 'grey')
      .style('stroke-dasharray', ('2, 3'))
      .attr('x1', 0)
      .attr('x1', xScale(d.TotalDeaths))
      .attr('y1', 0)
      .attr('x2', xScale(d.TotalDeaths))
      .attr('y2', GraphMaker.getCanvasHeight);
  }

  const handleDotClick = async function (d, i) {
    event.stopPropagation();
    if (i !== currentFocusedIndex) {
      currentFocusedIndex = i;
      removeHighlight();
      highlightDot(this);
      removeLinesToAxis();
      addLinesToAxis(d);
      setTooltipValue(d);
      await setHistoricalData(d);
      setSlider();
    }
  }

  // Base graph
  const graphWrap = addElementUnder('div', { class: 'graph-wrap' }, {}, 'confirmed-deaths');
  const graphDetails = addElementUnder('details', { class: 'graph-details' }, {}, '', graphWrap);
  const graphTitle = addElementUnder('summary', { class: 'graph-title' }, {}, '', graphDetails);
  graphTitle.innerHTML = 'Total Deaths - Total Confirmed Cases';
  const graphExplains= addElementUnder('p', {class: 'graph-explains' }, {}, '', graphDetails);
  graphExplains.innerHTML = 'Evolution of the total number of confirmed cases and deaths of a country in time';
  const GraphMaker =  Object.assign(
    {},
    dot(),
    margin(),
    canvas(),
    logScale(),
    xAxis(),
    yAxis(),
    tooltip(),
  );
  GraphMaker.setMargin({ top: 10, right: 30, bottom: 80, left: 80 });
  const graph = GraphMaker.setCanvas(800, 600, 'confirmed-deaths');
  select('#confirmed-deaths > svg').on('click', function () {
    removeHighlight();
    removeLinesToAxis();
    updateGraph(summaryData);
    slider.style.visibility = 'hidden';
    sliderLabel.innerHTML = '';
    currentFocusedIndex = -1;
  })
  const xScale = GraphMaker.getLogScale(0, max(summaryData, getTotalDeaths), 0, GraphMaker.getCanvasWidth(), 10);
  GraphMaker.setXAxis({ scale: xScale, tickNumber: 3, label: 'Total Deaths' });
  const yScale = GraphMaker.getLogScale(0, max(summaryData, getTotalConfirmed), GraphMaker.getCanvasHeight(), 0, 10**3);
  GraphMaker.setYAxis({ scale: yScale, label: 'Total Confirmed Cases' });
  const dots = GraphMaker.drawDots({
    data: summaryData,
    x: 'TotalDeaths',
    y: 'TotalConfirmed',
    xScale,
    yScale,
    size: 5,
    color: defaultColor,
  });

  dots.on('mouseover', () => tooltipObject.style('visibility', 'visible'))
    .on('mousemove', setTooltipValue)
    .on('mouseout', () => tooltipObject.style('visibility', 'hidden'))
    .on('click', handleDotClick);

  const tooltipObject = GraphMaker.setTooltip({});

  // Slider
  const sliderWrap = addElementUnder('div', {class: 'graph-control'}, {}, '', graphWrap);
  const sliderLabel = addElementUnder(
    'div',
    {},
    {},
    '',
    sliderWrap
  );

  const slider = addElementUnder(
    'input',
    { type: 'range', min: 0 },
    { visibility: 'hidden' },
    '',
    sliderWrap
  );

  slider.oninput = function () {
    const newData = currentFocusedHistoricalData[this.value];
    setSliderLabel(newData);
    updateDisplayData(newData);
    removeLinesToAxis();
    addLinesToAxis(newData);
  }
};