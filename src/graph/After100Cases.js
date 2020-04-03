import {select} from 'd3-selection';

import {addElementUnder} from '../util';
import { fetchHistoricalData, fetchCountriesList } from '../api';
import {margin} from '../mixin/margin';
import {canvas} from '../mixin/canvas';
import {linearScale} from'../mixin/linearScale';
import {xAxis} from'../mixin/xAxis';
import {yAxis} from'../mixin/yAxis';
import {tooltip} from '../mixin/tooltip';
import {line} from '../mixin/line';
import {dot} from '../mixin/dot';
import { logScale } from '../mixin/logScale';
import FlatQueue from 'flatqueue';

export const After100Cases = async function() {
  const maxTotalConfirmed = new FlatQueue();
  const maxTotalDeaths = new FlatQueue();
  const countriesList = await fetchCountriesList();
  const defaultColor = '#bebdb8';
  const highlightColor = 'orange';
  const defaultWidth = 2;
  const highlightWidth = 4;
  const initialSelectedCountries = ['italy', 'us'];
  let selectedCountries = [];
  let currentSelectedData = [];
  let selectedCountriesSet = new Set();
  let groupedData = [];
  let maxX = 0;  
  let currentYProp = 'TotalConfirmed';
  let currentYScale = 'linear';

  const filterAndGroupData = (data, countryCode) => {
    if (data.length === 0) {
      alert('No data found for selected country');
      return;
    }

    var i = 0;
    while (i < data.length && data[i].TotalConfirmed < 100) {
      i++;
    }
    const filteredData = data.slice(i, data.length);
    if (filteredData.length > 0) {
      groupedData.push(filteredData);
      selectedCountries.push(countryCode);
      selectedCountriesSet.add(countryCode);
      if (filteredData.length > maxX) {
        maxX = filteredData.length;
      }
      const lastData = filteredData[filteredData.length - 1];
      maxTotalConfirmed.push(countryCode, -lastData.TotalConfirmed);
      maxTotalDeaths.push(countryCode, -lastData.TotalDeaths);
    } else {
      alert('Selected country does not have more than 100 confirmed cases');
    }
  }

  const handleMouseOver = function() {
    select(this).attr('stroke-width', highlightWidth);
  }

  const handleMouseOut = function() {
    lines.attr('stroke-width', defaultWidth);
  }

  const getDotTooltipText = (data, index) => {
    if (currentYProp === 'TotalConfirmed') {
      return `${data.Country} Day ${index} 
        ${new Date(data.Date).toLocaleDateString()} Confirmed ${data[currentYProp]}`
    } else if (currentYProp === 'TotalDeaths') {
      return `${data.Country} Day ${index} 
        ${new Date(data.Date).toLocaleDateString()} Deaths ${data[currentYProp]}`
    }
  }

  const removeLineHighlight = () => {
    lines
      .attr('stroke', defaultColor)
      .classed('highlighted', false)
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut);
    texts.style('fill', defaultColor);
  }

  const removeLinesToAxis = () => {
    graph.selectAll('line.line-to-axis').remove();
  }

  const addLinesToAxis = (d, i) => {
    graph
      .append('line')
      .attr('class', 'line-to-axis')
      .style('stroke', 'grey')
      .style('stroke-dasharray', ('2, 3'))
      .attr('x1', 0)
      .attr('y1', yScale(d[currentYProp]))
      .attr('x2', GraphMaker.getCanvasWidth)
      .attr('y2', yScale(d[currentYProp]));

    graph.append('line')
      .attr('class', 'line-to-axis')
      .style('stroke', 'grey')
      .style('stroke-dasharray', ('2, 3'))
      .attr('x1', 0)
      .attr('x1', xScale(i))
      .attr('y1', 0)
      .attr('x2', xScale(i))
      .attr('y2', GraphMaker.getCanvasHeight);
  }

  const computeAverageGrowth = (d1, d2, period) => {
    return (((d2 / d1) ** (1 / period)) - 1 ) * 100;
  }

  const getGrowthRateText = (latestGrowth, averageGrowth) => (`
      <div class='space-between-text'><span>Growth From Previous day</span><span>${latestGrowth}</span></div>
      <div class='space-between-text'><span>Average Growth</span><span>${averageGrowth}</span></div>`);

  const handleClick = function (d, i) {
    event.stopPropagation();
    currentSelectedData = d;
    removeLineHighlight();
    removeLinesToAxis();
    select(this)
      .attr('stroke', highlightColor)
      .attr('stroke-width', defaultWidth)
      .classed('highlighted', true)
      .on('mouseover', ()=>{})
      .on('mouseout', ()=>{});
    const labelNodes = texts.nodes();
    select(labelNodes[i]).style('fill','black');

    let dots = GraphMaker.drawDots({
      data: currentSelectedData,
      y:  currentYProp,
      xScale,
      yScale,
      size: 5,
      color: highlightColor,
    });
    dots.on('mouseover', function () {
      tooltipObject.style('visibility', 'visible');
    }).on('mousemove', function (d, i) {
      tooltipObject.style('top', (event.pageY + 30) + 'px')
        .style('left', event.pageX + 'px')
        .html(getDotTooltipText(d, i))
      removeLinesToAxis();
      addLinesToAxis(d, i);
    }).on('mouseout', function () {
      tooltipObject.style('visibility', 'hidden')
        .html('');
    }).on('click', function(d, i, allData) {
      event.stopPropagation();
      if (i > 0) {
        let earliestNonZero = 0;
        let firstValue = select(allData[earliestNonZero]).data()[0][currentYProp];
        while (firstValue === 0 && earliestNonZero < i) {
          earliestNonZero++;
         firstValue = select(allData[earliestNonZero]).data()[0][currentYProp];
        }

        const currentData = select(allData[i]).data()[0];
        const currentValue = currentData[currentYProp];
        const previousValue = select(allData[i-1]).data()[0][currentYProp];
        const latestGrowth = computeAverageGrowth(previousValue, currentValue, 1);
        const averageGrowth = computeAverageGrowth(firstValue, currentValue, i - earliestNonZero);
        const formatedLatestGrowth = latestGrowth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
        const formatedAverageGrowth = averageGrowth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%'; 
        growthRateText.innerHTML = `<p>${currentData.Country} Day ${i}</p>${getGrowthRateText(formatedLatestGrowth, formatedAverageGrowth)}`;
      } else {
        growthRateText.innerHTML = `<p>${currentData.Country} Day ${i}</p>${getGrowthRateText(NaN, NaN)}`;
      }
    });
  }

  const clearSelected = () => {
    removeLineHighlight();
    removeLinesToAxis();
    currentSelectedData = [];
    GraphMaker.drawDots({
      data: currentSelectedData,
      y: currentYProp,
      xScale,
      yScale,
    });
  }

  // Get initial data
  for (let i in initialSelectedCountries) {
    const countryCode = initialSelectedCountries[i];
    let data = [];
    try {
      data = await fetchHistoricalData(countryCode);
      filterAndGroupData(data, countryCode);
    } catch(e) {
      console.error(e);
    }
  }

  const updateGraph = () => {
    xScale = GraphMaker.getLinearScale(0, maxX + 2, 0, GraphMaker.getCanvasWidth());
    if (!xAxisObject) {
      xAxisObject = GraphMaker.setXAxis({ scale: xScale, label: 'Day' });
    } else {
      xAxisObject = GraphMaker.updateXAxis({ scale: xScale, label: 'Day' });
    }
    let yAxisProps = {};
    let maxY; 
    if (currentYProp === 'TotalConfirmed') {
      yAxisProps.label = 'Total Confirmed Cases';
      maxY = - maxTotalConfirmed.peekValue();
    } else {
      yAxisProps.label = 'Total Deaths'; 
      maxY = - maxTotalDeaths.peekValue();
    }
    if (currentYScale === 'linear') {
      yScale = GraphMaker.getLinearScale(0, maxY + (maxY / 10), GraphMaker.getCanvasHeight(), 0);
    } else {
      yScale = GraphMaker.getLogScale(0, maxY + (maxY / 10), GraphMaker.getCanvasHeight(), 0, 10**3);
    }
    yAxisProps.scale = yScale;
    if (!yAxisObject) {
      yAxisObject = GraphMaker.setYAxis(yAxisProps);
    } else {
      yAxisObject = GraphMaker.updateYAxis(yAxisProps);
    }
    lines = GraphMaker.drawLines({
      data: groupedData,
      y: [currentYProp],
      xScale,
      yScale,
      color: defaultColor,
      size: defaultWidth,
    });
    texts = GraphMaker.drawLinesLabel({
      data: groupedData,
      y: [currentYProp],
      xScale,
      yScale,
      label: 'Country',
      color: defaultColor,
    })

    lines.on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)
      .on('click', handleClick);

    GraphMaker.drawDots({
      data: currentSelectedData,
      y: currentYProp,
      xScale,
      yScale,
      size: 5,
      color: highlightColor,
    });
  }

  // Base graph
  const graphWrap = addElementUnder('div', { class: 'graph-wrap' }, {}, 'after-100days');
  const GraphMaker = Object.assign(
    {},
    line(),
    canvas(),
    margin(),
    xAxis(), 
    yAxis(),
    linearScale(),
    logScale(),
    tooltip(),
    dot(),
  )
  GraphMaker.setMargin({ top: 10, right: 30, bottom: 80, left: 80 });
  const graph = GraphMaker.setCanvas(800, 600, 'after-100days');
  let xScale, xAxisObject, yScale, yAxisObject, lines, texts;
  const tooltipObject = GraphMaker.setTooltip({});
  const graphDetails = addElementUnder('details', { class: 'graph-details' }, {}, '', graphWrap);
  const graphTitle = addElementUnder('summary', { class: 'graph-title' }, {}, '', graphDetails);
  graphTitle.innerHTML = 'Trajectory After 100 Cases';
  const graphExplains= addElementUnder('p', {class: 'graph-explains' }, {}, '', graphDetails);
  graphExplains.innerHTML = 'Growth trajectories of confirmed cases and deaths since more than 100 cases recorded';
  updateGraph();
  select('#after-100days > svg').on('click', function () {
    clearSelected();
  })

  const graphControlPenal = addElementUnder('div', {class: 'graph-control'}, {}, '', graphWrap);

  // Countries select
  const countriesSelectLabel = addElementUnder('div', {class: 'input-label' }, {}, '', graphControlPenal);
  countriesSelectLabel.innerHTML = 'Add or Remove a Country';
  const countryDataList = addElementUnder('datalist', {}, {}, 'countries-data-list', graphControlPenal);
  countriesList.forEach(countryData => {
    const option = addElementUnder('option', {value: countryData.Slug}, {}, '', countryDataList);
    option.innerHTML = countryData.Country;
  })
  const countriesSelectInput = addElementUnder('input', {list:'countries-data-list'}, {}, '', graphControlPenal);

  countriesSelectInput.onkeydown = async function (event) {
    if (event.key === 'Enter') {
      const countryCode = event.target.value;
      const existingIndex = selectedCountries.indexOf(countryCode);
      if (existingIndex === -1) {
        try {
          let data = await fetchHistoricalData(countryCode);
          filterAndGroupData(data, countryCode);
        } catch (e) {
          console.error(e);
        }
      } else {
        if (groupedData.length > 1) {
          selectedCountries = [...selectedCountries.slice(0, existingIndex), ...selectedCountries.slice(existingIndex + 1)]
          selectedCountriesSet.delete(countryCode);
          groupedData = [...groupedData.slice(0, existingIndex), ...groupedData.slice(existingIndex + 1)];
          while (!selectedCountriesSet.has(maxTotalConfirmed.peek()) && maxTotalConfirmed.length > 0) {
            maxTotalConfirmed.pop();
          }
          while (!selectedCountriesSet.has(maxTotalDeaths.peek()) && maxTotalDeaths.length > 0) {
            maxTotalDeaths.pop();
          }
        }
      }
      countriesSelectInput.value = '';
      removeLinesToAxis();
      updateGraph();
    }
  }

  // Y value select
  const yValueRadioButtons = [
    { value: 'confirmed', checked: true, label: 'Total Confirmed Cases' },
    { value: 'deaths', checked: false, label: 'Total Deaths' }
  ];
  const yValueRadioInputWrap = addElementUnder('div', {}, {}, 'y-value-radio-input-wrap', graphControlPenal);
  const yValueradioInputLabel = addElementUnder('div', {class: 'input-label' }, {}, '', yValueRadioInputWrap);
  yValueradioInputLabel.innerHTML = 'Y Axis Value'
  yValueRadioButtons.forEach(button => {
    const props = { type: 'radio', value: button.value, name: 'y-axis-value' };
    if (button.checked) {
      props.checked = true;
    }
    addElementUnder('input', props, {}, '', yValueRadioInputWrap);
    let label = addElementUnder('label', {}, {}, '', yValueRadioInputWrap);
    label.innerHTML = button.label;
  })

  // Y scale select
  yValueRadioInputWrap.oninput = function(event) {
    let yAxisLabel;
    let maxY;
    if (event.target.value === 'deaths') {
      currentYProp = 'TotalDeaths';
      yAxisLabel = 'Total Deaths';
      maxY = - maxTotalDeaths.peekValue();
    } else if (event.target.value === 'confirmed') {
      currentYProp = 'TotalConfirmed';
      yAxisLabel = 'Total Confirmed Cases';
      maxY = - maxTotalConfirmed.peekValue();
    }
    if (currentYScale === 'linear') {
      yScale = GraphMaker.getLinearScale(0, maxY + (maxY / 10), GraphMaker.getCanvasHeight(), 0);
      GraphMaker.updateYAxis({ scale: yScale, label: yAxisLabel });
    } else {
      yScale = GraphMaker.getLogScale(0, maxY + (maxY / 10), GraphMaker.getCanvasHeight(), 0, 10**3);
      GraphMaker.updateYAxis({ scale: yScale, label: yAxisLabel });
    }
    removeLinesToAxis();
    updateGraph();
  }

  const yScaleRadioButtons = [
    { value: 'linear', checked: true, label: 'Linear Scale' },
    { value: 'log', checked: false, label: 'Log Scale' }
  ];
  const yScaleRadioInputWrap = addElementUnder('div', {}, {}, 'y-scale-radio-input-wrap', graphControlPenal);
  const yScaleRadioInputLabel = addElementUnder('div', {class: 'input-label' }, {}, '', yScaleRadioInputWrap);
  yScaleRadioInputLabel.innerHTML = 'Y Axis Scale'
  yScaleRadioButtons.forEach(button => {
    const props = { type: 'radio', value: button.value, name: 'y-axis-scale' };
    if (button.checked) {
      props.checked = true;
    }
    addElementUnder('input', props, {}, '', yScaleRadioInputWrap);
    let label = addElementUnder('label', {}, {}, '', yScaleRadioInputWrap);
    label.innerHTML = button.label;
  })

  yScaleRadioInputWrap.oninput = function(event) {
    currentYScale = event.target.value;
    let maxY = currentYProp === 'TotalDeaths' ? - maxTotalDeaths.peekValue() : -maxTotalConfirmed.peekValue();
    if (currentYScale === 'linear') {
      yScale = GraphMaker.getLinearScale(0, maxY + (maxY/ 10), GraphMaker.getCanvasHeight(), 0);
      GraphMaker.updateYAxis({ scale: yScale});
    } else {
      yScale = GraphMaker.getLogScale(0, maxY + (maxY / 10), GraphMaker.getCanvasHeight(), 0, 10 ** 3);
      GraphMaker.updateYAxis({ scale: yScale });
    }
    removeLinesToAxis();
    updateGraph();
  }

  // Text info
  const growthRateText = addElementUnder('div', {class: 'info-box'}, {}, '', graphControlPenal);

}