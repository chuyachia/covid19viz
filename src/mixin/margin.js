export const margin = () => {
  const margin = {top: 10, right: 30, bottom: 30, left: 60};
 
  return {
    getMargin: () => margin,
    setMargin: (newMargin) => margin = {...margin, ...newMargin},
  };
} 