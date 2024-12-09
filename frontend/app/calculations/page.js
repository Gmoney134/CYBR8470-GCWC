'use client';

import { useEffect, useState } from 'react';

export default function CalculationsPage() {
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);

  const fetchWeatherData = async (latitude, longitude) => {
    try {
      // Fetch the NWS Points API to get the forecast URL
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
      const forecastUrl = pointsData.properties?.forecast;

      if (!forecastUrl) {
        throw new Error('Forecast URL is not available for this location.');
      }

      // Fetch the forecast data using the URL from the Points API response
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
      const currentPeriod = forecastData.properties.periods[0]; // First forecast period

      setWeatherData({
        temperature: currentPeriod.temperature,
        temperatureUnit: currentPeriod.temperatureUnit,
        windSpeed: currentPeriod.windSpeed,
        windDirection: currentPeriod.windDirection || 'N/A',
      });
    } catch (err) {
      console.error(err);
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
        </div>
      ) : (
        !error && <p>Loading weather data...</p>
      )}
    </div>
  );
}

