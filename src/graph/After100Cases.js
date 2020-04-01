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

export const After100Cases = async function() {
  const countriesList = await fetchCountriesList();
  const defaultColor = '#bebdb8';
  const highlightColor = 'orange';
  const defaultWidth = 2;
  const highlightWidth = 4;
  const initialSelectedCountries = ['italy', 'us', 'germany', 'france', 'canada'];
  let selectedCountries = [];
  let groupedData = [];
  let maxX = 0;  
  let maxY = { TotalConfirmed: 0, TotalDeaths: 0 };
  let currentYProp = 'TotalConfirmed';
  let currentYScale = 'linear';

  const filterAndGroupData = (data) => {
    var i = 0;
    while (i < data.length && data[i].TotalConfirmed < 100) {
      i++;
    }
    const filteredData = data.slice(i, data.length);
    if (filteredData.length > 0) {
      groupedData.push(filteredData);
      if (filteredData.length > maxX) {
        maxX = filteredData.length;
      }
      const lastData = filteredData[filteredData.length - 1];
      if (lastData.TotalConfirmed > maxY.TotalConfirmed) {
        maxY.TotalConfirmed = lastData.TotalConfirmed;
      }
      if (lastData.TotalDeaths > maxY.TotalDeaths) {
        maxY.TotalDeaths = lastData.TotalDeaths;
      }
    } else {
      alert('Selected country does not have more than 100 confirmed cases');
    }
  }

  for (let i in initialSelectedCountries) {
    const countryCode = initialSelectedCountries[i];
    let data = [];
    try {
      data = await fetchHistoricalData(countryCode);
      filterAndGroupData(data);
      selectedCountries.push(countryCode);
    } catch(e) {
      console.error(e);
    }
  }

  const graphTitle = addElementUnder('h2', { class: 'graph-title' }, {}, 'after-100days-graph-title', 'after-100days');
  graphTitle.innerHTML = 'Trajectory After 100 Cases';
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
    graph.selectAll('line.highlight-line').remove();
  }

  const addLinesToAxis = (d, i) => {
    graph
      .append('line')
      .attr('class', 'highlight-line')
      .style('stroke', 'grey')
      .style('stroke-dasharray', ('2, 3'))
      .attr('x1', 0)
      .attr('y1', yScale(d[currentYProp]))
      .attr('x2', GraphMaker.getCanvasWidth)
      .attr('y2', yScale(d[currentYProp]));

    graph.append('line')
      .attr('class', 'highlight-line')
      .style('stroke', 'grey')
      .style('stroke-dasharray', ('2, 3'))
      .attr('x1', 0)
      .attr('x1', xScale(i))
      .attr('y1', 0)
      .attr('x2', xScale(i))
      .attr('y2', GraphMaker.getCanvasHeight);
  }

  const handleClick = function (d, i) {
    event.stopPropagation();
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

    const dots = GraphMaker.drawDots({
      data: d,
      y:  currentYProp,
      xScale,
      yScale,
      size: highlightWidth,
      color: highlightColor,
    });
    dots.on('mouseover', function () {
      tooltipObject.style('visibility', 'visible');
    }).on('mousemove', function (d, i) {
      tooltipObject.style('top', (event.pageY + 30) + 'px')
        .style('left', event.pageX + 'px')
        .html(getDotTooltipText(d, i))
      removeLinesToAxis();
      addLinesToAxis(d,i);
    }).on('mouseout', function () {
      tooltipObject.style('visibility', 'hidden')
        .html('');
    });
  }

  const clearSelected = () => {
    removeLineHighlight();
    removeLinesToAxis();
    GraphMaker.drawDots({
      data: [],
      y: currentYProp,
      xScale,
      yScale,
    });
  }
  
  select('#after-100days > svg').on('click', function () {
    clearSelected();
  })

  const updateGraph = () => {
    xScale = GraphMaker.getLinearScale(0, maxX + 2, 0, GraphMaker.getCanvasWidth());
    if (!xAxisObject) {
      xAxisObject = GraphMaker.setXAxis({ scale: xScale, label: 'Day' });
    } else {
      xAxisObject = GraphMaker.updateXAxis({ scale: xScale, label: 'Day' });
    }
    let yAxisProps = {};
    if (currentYProp === 'TotalConfirmed') {
      yAxisProps.label = 'Total Confirmed Cases';
    } else {
      yAxisProps.label = 'Total Deaths'; 
    }
    if (currentYScale === 'linear') {
      yScale = GraphMaker.getLinearScale(100, maxY[currentYProp] + (maxY[currentYProp] / 10), GraphMaker.getCanvasHeight(), 0);
    } else {
      yScale = GraphMaker.getLogScale(100, maxY[currentYProp] + (maxY[currentYProp] / 10), GraphMaker.getCanvasHeight(), 0, 10**3);
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
  }

  updateGraph();

  addElementUnder('div', {}, {}, 'after-100days-control-panel', 'after-100days');
  const yValueRadioButtons = [
    { value: 'confirmed', checked: true, label: 'Total Confirmed Cases' },
    { value: 'deaths', checked: false, label: 'Total Deaths' }
  ];
  const yValueRadioInputWrap = addElementUnder('div', {}, {}, 'y-value-radio-input-wrap', 'after-100days-control-panel');
  const yValueradioInputLabel = addElementUnder('div', {class: 'input-label' }, {}, '', 'y-value-radio-input-wrap');
  yValueradioInputLabel.innerHTML = 'Y Axis Value'
  yValueRadioButtons.forEach(button => {
    const props = { type: 'radio', value: button.value, name: 'y-axis-value' };
    if (button.checked) {
      props.checked = true;
    }
    addElementUnder('input', props, {}, '', 'y-value-radio-input-wrap');
    let label = addElementUnder('label', {}, {}, '', 'y-value-radio-input-wrap');
    label.innerHTML = button.label;
  })

  yValueRadioInputWrap.oninput = function(event) {
    clearSelected();
    let yAxisLabel;
    if (event.target.value === 'deaths') {
      currentYProp = 'TotalDeaths';
      yAxisLabel = 'Total Deaths';
    } else if (event.target.value === 'confirmed') {
      currentYProp = 'TotalConfirmed';
      yAxisLabel = 'Total Confirmed Cases';
    }
    if (currentYScale === 'linear') {
      yScale = GraphMaker.getLinearScale(0, maxY[currentYProp] + (maxY[currentYProp] / 10), GraphMaker.getCanvasHeight(), 0);
      GraphMaker.updateYAxis({ scale: yScale, label: yAxisLabel });
    } else {
      yScale = GraphMaker.getLogScale(0, maxY[currentYProp] + (maxY[currentYProp] / 10), GraphMaker.getCanvasHeight(), 0, 10**3);
      GraphMaker.updateYAxis({ scale: yScale, label: yAxisLabel });
    }
    lines = GraphMaker.drawLines({
      data: groupedData,
      y: currentYProp,
      xScale,
      yScale,
      color: defaultColor,
      size: defaultWidth,
    });
    texts = GraphMaker.drawLinesLabel({
      data: groupedData,
      y: currentYProp,
      label: 'Country',
      xScale,
      yScale,
      color: defaultColor,
    })
  }

  const yScaleRadioButtons = [
    { value: 'linear', checked: true, label: 'Linear Scale' },
    { value: 'log', checked: false, label: 'Log Scale' }
  ];
  const yScaleRadioInputWrap = addElementUnder('div', {}, {}, 'y-scale-radio-input-wrap', 'after-100days-control-panel');
  const yScaleradioInputLabel = addElementUnder('div', {class: 'input-label' }, {}, '', 'y-scale-radio-input-wrap');
  yScaleradioInputLabel.innerHTML = 'Y Axis Scale'
  yScaleRadioButtons.forEach(button => {
    const props = { type: 'radio', value: button.value, name: 'y-axis-scale' };
    if (button.checked) {
      props.checked = true;
    }
    addElementUnder('input', props, {}, '', 'y-scale-radio-input-wrap');
    let label = addElementUnder('label', {}, {}, '', 'y-scale-radio-input-wrap');
    label.innerHTML = button.label;
  })
  yScaleRadioInputWrap.oninput = function(event) {
    clearSelected();
    currentYScale = event.target.value;
    if (currentYScale === 'linear') {
      yScale = GraphMaker.getLinearScale(0, maxY[currentYProp] + (maxY[currentYProp] / 10), GraphMaker.getCanvasHeight(), 0);
      GraphMaker.updateYAxis({ scale: yScale});
    } else {
      yScale = GraphMaker.getLogScale(0, maxY[currentYProp] + (maxY[currentYProp] / 10), GraphMaker.getCanvasHeight(), 0, 10 ** 3);
      GraphMaker.updateYAxis({ scale: yScale });
    }

    GraphMaker.updateYAxis({ scale: yScale });
    lines = GraphMaker.drawLines({
      data: groupedData,
      y: currentYProp,
      xScale,
      yScale,
      color: defaultColor,
      size: defaultWidth,
    });
    texts = GraphMaker.drawLinesLabel({
      data: groupedData,
      y: currentYProp,
      label: 'Country',
      xScale,
      yScale,
      color: defaultColor,
    })
  }

  const countriesSelectLabel = addElementUnder('div', {class: 'input-label' }, {}, '', 'after-100days-control-panel');
  countriesSelectLabel.innerHTML = 'Add Country';
  addElementUnder('datalist', {}, {}, 'countries-data-list', 'after-100days-control-panel');
  countriesList.forEach(countryData => {
    const option = addElementUnder('option', {value: countryData.Slug}, {}, '', 'countries-data-list');
    option.innerHTML = countryData.Country;
  })
  const countriesSelectInput = addElementUnder('input', {list:'countries-data-list'}, {}, '', 'after-100days-control-panel');
  countriesSelectInput.onselect = async function(event) {
    const countryCode = event.target.value;
    const existingIndex = selectedCountries.indexOf(countryCode);
    if (existingIndex === -1) {
      try {
        let data = await fetchHistoricalData(countryCode);
        filterAndGroupData(data);
        selectedCountries.push(countryCode);
      } catch (e) {
        console.error(e);
      } finally {
        countriesSelectInput.value = '';
      }
    } else {
      selectedCountries = [...selectedCountries.slice(0, existingIndex), ...selectedCountries.slice(existingIndex + 1)]
      groupedData = [...groupedData.slice(0, existingIndex), ...groupedData.slice(existingIndex + 1)];
      countriesSelectInput.value = '';
    }
    updateGraph();
  }

}