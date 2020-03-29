const apiBase = 'https://api.covid19api.com';

const cache = {};


export async function fetchSummaryData() {
  if (cache.summary) {
    return cache.summary;
  }

  const response = await fetch(apiBase+'/summary');
  if (response.ok) {
    const data = await response.json();
    cache.summary = data.Countries;

    return data.Countries;
  } else {
    return [];
  }
}

export async function fetchHistoricalData(countryCode) {
  if (cache[countryCode]) {
    return cache[countryCode];
  }

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

  cache[countryCode] = combined;

  return combined;
}
