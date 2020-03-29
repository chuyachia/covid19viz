import {select} from 'd3-selection';
import {max} from 'd3-array';
import {scatter} from './graph/scatter';

import './style.css';
// TODO add country highlight select 

const apiBase = 'https://api.covid19api.com';

async function fetchSummaryData() {
  const response = await fetch(apiBase+'/summary');
  if (response.ok) {
    const data = await response.json();

    return data;
  } else {
    return [];
  }
}

async function fetchHistoricalData(countryCode) {
  let [confirmed, deaths] = await Promise.all([
    fetch(apiBase + `/total/country/${countryCode}/status/confirmed`),
    fetch(apiBase + `/total/country/${countryCode}/status/deaths`)
  ]);

  confirmed = await confirmed.json();
  deaths = await deaths.json();

  const combined = [];
  for (let i = 0;i < confirmed.length ; i++) {
    let c = confirmed[i];
    const data = { Date: c.Date, Country: c.Country, TotalConfirmed: c.Cases };
    let d = deaths[i];
    if (d.Date === c.Date) {
      data.TotalDeaths = d.Cases;
    }
    combined.push(data); 
  }

  return combined;
}

function addElementUnder(element, props, style, elementId, parentId) {
  const newElement = document.createElement(element);
  newElement.setAttribute('id',elementId);
  for (let p in props) {
    newElement.setAttribute(p, props[p]);
  }

  for (let s in style) {
    newElement.style[s] = style[s];
  }

  let parent = document.getElementById(parentId);
  if (!parent) {
    parent =  document.body;
  }
  parent.appendChild(newElement);

  return newElement;
}

(async function() {
  const data = await fetchSummaryData();
  if (data.Countries) {
    const defaultColor = '#20B2AA';
    const hightLightColor = 'orange';
    let summaryData = data.Countries;
    let currentFocusedIndex;
    let currentFocusedCountry;
    let currentFocusedHistoricalData;

    const getTotalConfirmed = (d) => d.TotalConfirmed;
    const getTotalDeaths = (d) => d.TotalDeaths
    const setSliderLabel = (data) => {
      const date = new Date(data.Date);
      sliderLabel.innerHTML = `${data.Country} in ${date.toLocaleDateString()}
      Confirmed ${data.TotalConfirmed} Deaths ${data.TotalDeaths}`;
    }
    const updateGraph = (data) => {
      dots.data(data)
        .attr('cx', function (d) { return xScale(d.TotalDeaths); })
        .attr('cy', function (d) { return yScale(d.TotalConfirmed); });
    }

    const updateDisplayData = (newData) => {
      const newSummaryData = [...summaryData.slice(0, currentFocusedIndex), newData, ...summaryData.slice(currentFocusedIndex+1)];
      updateGraph(newSummaryData);
    }

    const setTooltipValue = (d) => {
      tooltip.style('top', (yScale(d.TotalConfirmed) + 50) + 'px')
      .style('left', xScale(d.TotalDeaths) + 'px')
      .html(`${d.Country} Confirmed ${d.TotalConfirmed} Deaths ${d.TotalDeaths}`);
    }

    const setHistoricalData = async  (d) => {
      if (currentFocusedCountry !== d.Slug) {
        currentFocusedCountry = d.Slug;
        currentFocusedHistoricalData = await fetchHistoricalData(d.Slug);
      }
    }

    const setSlider = (i) => {
      if (currentFocusedIndex == i) {
        slider.style.visibility = 'hidden';
      } else {
        let lastDateIndex = currentFocusedHistoricalData.length - 1;
        slider.setAttribute('max', lastDateIndex);
        slider.setAttribute('min', 0);
        slider.value = lastDateIndex;
        slider.style.visibility = 'visible';

        const data = currentFocusedHistoricalData[lastDateIndex];
        const initialDate = new Date(data.Date);
        sliderLabel.innerHTML = `${data.Country} in 
        ${initialDate.toLocaleDateString()} Confirmed ${data.TotalConfirmed} Deaths ${data.TotalDeaths}`
      }
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

    const handleDotClick = async function(d, i) {
      if (i === currentFocusedIndex) {
        removeHighlight();
        removeLinesToAxis();
        currentFocusedIndex = -1;
      } else {
        removeHighlight();
        highlightDot(this);
        removeLinesToAxis();
        addLinesToAxis(d);
        updateGraph(summaryData);
        setTooltipValue(d);
        await setHistoricalData(d);
        setSlider(i);
        currentFocusedIndex = i;
      }
    }

    // Base graph
    const Scatter = scatter();
    const graph = Scatter.setCanvas(800, 500, 'confirmed-deaths');
    const xScale = Scatter.getScale(0.1, max(summaryData, getTotalDeaths), 0, Scatter.getCanvasWidth());
    Scatter.setXAxis(xScale, 10);
    const yScale = Scatter.getScale(0.1, max(summaryData,  getTotalConfirmed), Scatter.getCanvasHeight(), 0);
    Scatter.setYAxis(yScale, 6);
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
      'h5',
      { },
      { },
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

    slider.oninput= function() {
      const newData = currentFocusedHistoricalData[this.value];
      setSliderLabel(newData); 
      updateDisplayData(newData);
      removeLinesToAxis();
      addLinesToAxis(newData);
    }

  }
})();