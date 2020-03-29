import {select} from 'd3-selection';
import {max} from 'd3-array';
import {scatter} from './graph/scatter';

import {fetchSummaryData, fetchHistoricalData} from './api';
import {addElementUnder} from './util';

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
      <div>${data.Country} in ${date.toLocaleDateString()}</div>
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
    tooltip.style('top', (event.pageY + 30) + 'px')
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
    graph.selectAll('line').remove();
  }

  const addLinesToAxis = (d) => {
    graph
      .append('line')
      .style('stroke', 'grey')
      .style('stroke-dasharray', ('2, 3'))
      .attr('x1', 0)
      .attr('y1', yScale(d.TotalConfirmed))
      .attr('x2', Scatter.getCanvasWidth)
      .attr('y2', yScale(d.TotalConfirmed));

    graph.append('line')
      .style('stroke', 'grey')
      .style('stroke-dasharray', ('2, 3'))
      .attr('x1', 0)
      .attr('x1', xScale(d.TotalDeaths))
      .attr('y1', 0)
      .attr('x2', xScale(d.TotalDeaths))
      .attr('y2', Scatter.getCanvasHeight);
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
  const graphTitle = addElementUnder('h2', { class: 'graph-title' }, {}, 'confirmed-deaths-graph-title', 'confirmed-deaths');
  graphTitle.innerHTML = 'Total Deaths - Total Confirmed Cases';
  const Scatter = scatter();
  Scatter.setMargin({ top: 10, right: 30, bottom: 60, left: 60 });
  const graph = Scatter.setCanvas(800, 600, 'confirmed-deaths');
  select('#confirmed-deaths > svg').on('click', function () {
    removeHighlight();
    removeLinesToAxis();
    updateGraph(summaryData);
    slider.style.visibility = 'hidden';
    sliderLabel.innerHTML = '';
    currentFocusedIndex = -1;
  })
  const xScale = Scatter.getLogScale(0.1, max(summaryData, getTotalDeaths), 0, Scatter.getCanvasWidth());
  Scatter.setXAxis(xScale, 6, 'Total Deaths');
  const yScale = Scatter.getLogScale(0.1, max(summaryData, getTotalConfirmed), Scatter.getCanvasHeight(), 0);
  Scatter.setYAxis(yScale, 6, 'Total Confirmed Cases');
  const dots = Scatter.drawDots({
    data: summaryData,
    x: 'TotalDeaths',
    y: 'TotalConfirmed',
    xScale,
    yScale,
    size: 5,
    color: defaultColor,
  });

  dots.on('mouseover', () => tooltip.style('visibility', 'visible'))
    .on('mousemove', setTooltipValue)
    .on('mouseout', () => tooltip.style('visibility', 'hidden'))
    .on('click', handleDotClick);

  const tooltip = Scatter.setTooltip({});

  // Slider
  const sliderWrap = addElementUnder('div', {}, {}, 'confirmed-deaths-slider-wrap', 'confirmed-deaths');
  const sliderLabel = addElementUnder(
    'div',
    { class: 'input-label' },
    {},
    'confirmed-deaths-slider-text',
    'confirmed-deaths-slider-wrap'
  );

  const slider = addElementUnder(
    'input',
    { type: 'range', min: 0 },
    { visibility: 'hidden' },
    'confirmed-deaths-slider',
    'confirmed-deaths-slider-wrap'
  );

  slider.oninput = function () {
    const newData = currentFocusedHistoricalData[this.value];
    setSliderLabel(newData);
    updateDisplayData(newData);
    removeLinesToAxis();
    addLinesToAxis(newData);
  }
};