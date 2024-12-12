'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = 'http://localhost:8000';

export default function CalculationsPage({ token }) {
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [adjustedDistances, setAdjustedDistances] = useState([]);
  const [error, setError] = useState(null);
  const [hasGolfClubs, setHasGolfClubs] = useState(true);
  

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
        windSpeed: currentPeriod.windSpeed,
        windDirection: currentPeriod.windDirection || 'N/A',
        humidity,
      });
    } catch (err) {
      console.error('Error fetching weather data:', err.message);
      setError(err.message);
    }
  };
  
  const fetchAdjustedDistances = async () => {
    if (!weatherData) {
      setError('Weather data is not available.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/GCWC/calculations/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(weatherData),
      }); 
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response body:', errorText);
        if (response.status === 404 && errorText.includes('No golf clubs')) {
          setHasGolfClubs(false); // Update state to indicate no golf clubs
          return;
        }
        throw new Error(`Calculations API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      setAdjustedDistances(data.golf_clubs);
    } catch (err) {
      console.error('Error fetching adjusted distances:', err.message);
      setError(err.message);
    }
  };


  useEffect(() => {
    console.log('Updated adjustedDistances:', adjustedDistances); // Log updated state
  }, [adjustedDistances]);

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

  useEffect(() => {
    if (weatherData) {
      fetchAdjustedDistances();
    }
  }, [weatherData]);

  return (
    <div>
      <h1>Weather Calculations</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {weatherData ? (
        <div>
          <h2>Current Weather</h2>
          <p>
            <strong>Temperature:</strong> {weatherData.temperature} F
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
      {!hasGolfClubs ? (
        <div>
          <h2>No Golf Clubs Found</h2>
          <p>
            It looks like you haven't added any golf clubs to your bag. Please visit your{' '}
            <a href="/profile" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
              profile page
            </a>{' '}
            to add your clubs.
          </p>
        </div>
      ) : adjustedDistances.length > 0 ? (
        <div>
          <h2>Adjusted Distances</h2>
          <ul>
            {adjustedDistances.map((club, index) => (
              <li key={index}>
                <strong>{club.club_name}</strong>:
                <ul>
                  <li>Original Distance: {club.original_distance} yards</li>
                  <li>
                    Adjusted Distances:
                    <ul>
                      {Object.entries(club.adjusted_distance).map(([direction, distance]) => (
                        <li key={direction}>
                          {direction}: {distance} yards
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        !error && <p>Loading adjusted distances...</p>
      )}
    </div>
  );
}
