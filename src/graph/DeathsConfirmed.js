import {select} from 'd3-selection';
import {max} from 'd3-array';

import {margin} from '../mixin/margin';
import {baseGraph} from '../mixin/baseGraph';
import {logScale} from'../mixin/logScale';
import {xAxis} from'../mixin/xAxis';
import {yAxis} from'../mixin/yAxis';
import {dot} from '../mixin/dot';
import {tooltip} from '../mixin/tooltip';
import {fetchSummaryData, fetchHistoricalData,fetchCountriesList} from '../api';
import {addElementUnder} from '../util';

export const DeathsConfirmedGraph = async function () {
  let countriesList = [];
  let summaryData = []
  let retryInfo;
  const defaultColor = '#20B2AA';
  const hightLightColor = 'orange';
  let currentFocusedIndex;
  let currentFocusedCountry;
  let currentFocusedHistoricalData;

  const getInitialData = async () => {
    try {
      if (retryInfo) {
        retryInfo.style.visibility = 'hidden';
      }
      countriesList = await fetchCountriesList();
      summaryData = await fetchSummaryData();
      if (countriesList.length === 0 || summaryData.length === 0) {
        throw new Error();
      }
    } catch (e) {
      if (retryInfo) {
        retryInfo.style.visibility = 'visible';
      } else {
        retryInfo = addElementUnder('div', {}, {}, '', graphWrap);
        retryInfo.innerHTML = 'Something went wrong while loading data.';
        const retryButton = addElementUnder('button', {}, {}, '', retryInfo);
        retryButton.innerHTML = 'Try again';
        retryButton.onclick = getInitialData;
      }
    }
  }

  const getTotalConfirmed = (d) => d.TotalConfirmed;
  const getTotalDeaths = (d) => d.TotalDeaths
  const getDeathsConfirmedText = (data) => (`
      <div class='space-between-text'><span>Confirmed</span><span>${data.TotalConfirmed.toLocaleString()}</span></div>
      <div class='space-between-text'><span>Deaths</span><span>${data.TotalDeaths.toLocaleString()}</span></div>`);

  const setInfoBoxText = (data) => {
    const date = new Date(data.Date);
    infoBox.innerHTML = `
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
    setInfoBoxText(data);
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
    GraphMaker.removeLineToXAxis();
    GraphMaker.removeLineToYAxis();
  }

  const addLinesToAxis = (d) => {
    GraphMaker.drawLineToYAxis({scale: yScale, y:d.TotalConfirmed});
    GraphMaker.drawLineToXAxis({ scale: xScale, x: d.TotalDeaths });
  }

  const handleDotMouseover = function (d) {
    tooltipObject.style('visibility', 'visible');
  }

  const handleDotMouseout = () => {
    tooltipObject.style('visibility', 'hidden');
  }

  const handleDotClick = async function (d, i) {
    event.stopPropagation();
    removeLinesToAxis();
    addLinesToAxis(d);
    if (i !== currentFocusedIndex) {
      currentFocusedIndex = i;
      removeHighlight();
      highlightDot(this);
      setTooltipValue(d);
      await setHistoricalData(d);
      if (currentFocusedHistoricalData.length > 0) {
        setSlider();
      }
    }
  }

  // Base graph
  const graphWrap = document.getElementById('confirmed-deaths');
  const graphDetails = addElementUnder('details', { class: 'graph-details' }, {}, '', graphWrap);
  const graphTitle = addElementUnder('summary', { class: 'graph-title' }, {}, '', graphDetails);
  graphTitle.innerHTML = 'Total Deaths - Total Confirmed Cases';
  const graphExplains= addElementUnder('p', {class: 'graph-explains' }, {}, '', graphDetails);
  graphExplains.innerHTML = 'Evolution of confirmed cases and deaths in time';

  await getInitialData();

  const GraphMaker =  Object.assign(
    {},
    dot(),
    margin(),
    baseGraph(),
    logScale(),
    xAxis(),
    yAxis(),
    tooltip(),
  );
  GraphMaker.setMargin({ top: 10, right: 30, bottom: 80, left: 80 });
  const graph = GraphMaker.setGraph(800, 600, 'confirmed-deaths');
  GraphMaker.setTransition(350);
  select('#confirmed-deaths > svg').on('click', function () {
    removeHighlight();
    removeLinesToAxis();
    updateGraph(summaryData);
    slider.style.visibility = 'hidden';
    infoBox.innerHTML = '';
    currentFocusedIndex = -1;
  })
  const xScale = GraphMaker.getLogScale(0, max(summaryData, getTotalDeaths), 0, GraphMaker.getGraphWidth(), 10);
  GraphMaker.setXAxis({ scale: xScale, tickNumber: 3, label: 'Total Deaths' });
  const yScale = GraphMaker.getLogScale(0, max(summaryData, getTotalConfirmed), GraphMaker.getGraphHeight(), 0, 10**3);
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

  dots.on('mouseover',handleDotMouseover)
    .on('mousemove', setTooltipValue)
    .on('mouseout', handleDotMouseout)
    .on('click', handleDotClick);

  const tooltipObject = GraphMaker.setTooltip({});

  const graphControlPenal = addElementUnder('div', {class: 'graph-control'}, {}, '', graphWrap);

  // Country select
  const countrySelectWrap = addElementUnder('div', {}, {}, '', graphControlPenal);
  const countrySelectLabel = addElementUnder('div', {class: 'input-label' }, {}, '', countrySelectWrap);
  countrySelectLabel.innerHTML = 'Select a Country';
  const countryDataList = addElementUnder('datalist', {}, {}, 'countries-data-list', countrySelectWrap);
  countriesList.forEach(countryData => {
    const option = addElementUnder('option', {value: countryData.Slug}, {}, '', countryDataList);
    option.innerHTML = countryData.Country;
  })
  const countrySelectInput = addElementUnder('input', {list:'countries-data-list'}, {}, '', countrySelectWrap);
  countrySelectInput.onkeydown = function (event) {
    if (event.key === 'Enter') {
      const countryCode = event.target.value;
      const existingIndex = summaryData.findIndex(d => d.Slug === countryCode);
      if (existingIndex !== -1) {
        const selectedDot = dots.filter((d,i)=> i === existingIndex).node();
        handleDotClick.call(selectedDot, summaryData[existingIndex], existingIndex);
        countrySelectInput.value = '';
      } else {
        alert('No data found for selected country');
      }
    }
  }

  // Slider
  const slider = addElementUnder(
    'input',
    { type: 'range', min: 0 },
    { visibility: 'hidden' },
    '',
    graphControlPenal
  );

  slider.oninput = function () {
    const newData = currentFocusedHistoricalData[this.value];
    setInfoBoxText(newData);
    updateDisplayData(newData);
    removeLinesToAxis();
    addLinesToAxis(newData);
  }

  // Cases number info
  const infoBox = addElementUnder(
    'div',
    {class:'info-box'},
    {},
    '',
    graphControlPenal
  );

};