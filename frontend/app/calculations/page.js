'use client';

import { useEffect, useState } from 'react';

export default function CalculationsPage() {
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);

  const fetchWeatherData = async (latitude, longitude) => {
    try {
      const pointsResponse = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`, {
        headers: {
          'User-Agent': 'Test/1.0 (nichter.grant@gmail.com)',
          'Accept': 'application/json',
        },
      });
  
      if (!pointsResponse.ok) {
        throw new Error(`Points API request failed with status: ${pointsResponse.status}`);
      }
  
      const pointsData = await pointsResponse.json();
      console.log('Points API response:', pointsData);
  
      const forecastUrl = pointsData.properties?.forecast;
      const gridDataUrl = pointsData.properties?.forecastGridData;
  
      if (!forecastUrl || !gridDataUrl) {
        throw new Error('Required forecast URLs are not available for this location.');
      }
  
      // Fetch forecast data (temperature, wind, etc.)
      const forecastResponse = await fetch(forecastUrl, {
        headers: {
          'User-Agent': 'Test/1.0 (nichter.grant@gmail.com)',
          'Accept': 'application/json',
        },
      });
  
      if (!forecastResponse.ok) {
        throw new Error(`Forecast API request failed with status: ${forecastResponse.status}`);
      }
  
      const forecastData = await forecastResponse.json();
      const currentPeriod = forecastData.properties.periods[0];
  
      // Fetch grid data (humidity)
      const gridDataResponse = await fetch(gridDataUrl, {
        headers: {
          'User-Agent': 'Test/1.0 (nichter.grant@gmail.com)',
          'Accept': 'application/json',
        },
      });
  
      if (!gridDataResponse.ok) {
        throw new Error(`Grid Data API request failed with status: ${gridDataResponse.status}`);
      }
  
      const gridData = await gridDataResponse.json();
      const humidity = gridData.properties.relativeHumidity?.values[0]?.value || 'N/A';
  
      // Update weather data state
      setWeatherData({
        temperature: currentPeriod.temperature,
        temperatureUnit: currentPeriod.temperatureUnit,
        windSpeed: currentPeriod.windSpeed,
        windDirection: currentPeriod.windDirection || 'N/A',
        humidity,
      });
    } catch (err) {
      console.error('Error fetching weather data:', err.message);
      setError(err.message);
    }
  };
  

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          fetchWeatherData(latitude, longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Unable to retrieve location. Please allow location access.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  }, []);

  return (
    <div>
      <h1>Weather Calculations</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {location && (
        <p>
          <strong>Your Location:</strong> {location.latitude}, {location.longitude}
        </p>
      )}
      {weatherData ? (
        <div>
          <h2>Current Weather</h2>
          <p>
            <strong>Temperature:</strong> {weatherData.temperature} {weatherData.temperatureUnit}
          </p>
          <p>
            <strong>Wind Speed:</strong> {weatherData.windSpeed}
          </p>
          <p>
            <strong>Wind Direction:</strong> {weatherData.windDirection}
          </p>
          <p>
            <strong>Humidity:</strong> {weatherData.humidity}%
          </p>
        </div>
      ) : (
        !error && <p>Loading weather data...</p>
      )}
    </div>
  );
}
