'use client';

import { useEffect, useState } from 'react';
import styles from './calculations.module.css';

const API_BASE_URL = 'http://localhost:8000';

export default function CalculationsPage({ token }) {
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [adjustedDistances, setAdjustedDistances] = useState([]);
  const [error, setError] = useState(null);
  const [hasGolfClubs, setHasGolfClubs] = useState(true);
  const [selectedDirection, setSelectedDirection] = useState('N');

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
      <div className={styles.pageContainer}>
        <h1 className={styles.title}>Weather Calculations</h1>
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
  
        {weatherData ? (
          <div className={styles.weatherBar}>
          <div className={styles.weatherItem}>
            <strong>Temperature:</strong>
            <span>{weatherData.temperature}°F</span>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.weatherItem}>
            <strong>Wind:</strong>
            <span>{weatherData.windSpeed} {weatherData.windDirection}</span>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.weatherItem}>
            <strong>Humidity:</strong>
            <span>{weatherData.humidity}%</span>
          </div>
        </div>
        ) : (
          !error && <p>Loading weather data...</p>
        )}
  
        {!hasGolfClubs ? (
          <div>
            <h2>No Golf Clubs Found</h2>
            <p>
              It looks like you haven't added any golf clubs to your bag. Please visit your{' '}
              <a href="/profile" className={styles.link}>
                profile page
              </a>{' '}
              to add your clubs.
            </p>
          </div>
        ) : adjustedDistances.length > 0 ? (
          <div>
            <h2 className={styles.title}>Adjusted Distances</h2>
            {/* Dropdown for Direction Selection */}
            <div className={styles.dropdownContainer}>
              <label htmlFor="directionSelect" className={styles.dropdownLabel}>
                Select Facing Direction:
              </label>
              <select
                id="directionSelect"
                className={styles.dropdown}
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
              >
                <option value="N">North</option>
                <option value="NNE">North-Northeast</option>
                <option value="NE">Northeast</option>
                <option value="ENE">East-Northeast</option>
                <option value="E">East</option>
                <option value="ESE">East-Southeast</option>
                <option value="SE">Southeast</option>
                <option value="SSE">South-Southeast</option>
                <option value="S">South</option>
                <option value="SSW">South-Southwest</option>
                <option value="SW">Southwest</option>
                <option value="WSW">West-Southwest</option>
                <option value="W">West</option>
                <option value="WNW">West-Northwest</option>
                <option value="NW">Northwest</option>
                <option value="NNW">North-Northwest</option>
              </select>
            </div>
  
            {/* Club Distances */}
            <div className={styles.clubsContainer}>
              {adjustedDistances.map((club, index) => (
                <div key={index} className={styles.clubBox}>
                  <div className={styles.clubName}>
                    {club.club_name}
                    <span className={styles.adjustedDistance}>
                      {club.adjusted_distance[selectedDirection]}
                    </span>
                  </div>
                  <div className={styles.originalDistance}>
                    Original: {club.original_distance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !error && <p>Loading adjusted distances...</p>
        )}
        <div><p>*All distances are in yards*</p></div>
      </div>
    );
  }
