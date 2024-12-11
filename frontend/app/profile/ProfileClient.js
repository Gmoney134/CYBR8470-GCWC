'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE_URL = 'http://localhost:8000';

export default function ProfileClient({ userProfile, token }) {
  const [golfClubs, setGolfClubs] = useState(userProfile.golf_clubs || []);
  const [clubName, setClubName] = useState('');
  const [distance, setDistance] = useState('');
  const [error, setError] = useState(null);


  const addGolfClub = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/GCWC/profile/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ club_name: clubName, distance: parseInt(distance, 10) }),
      });

      if (!response.ok) {
        throw new Error('Failed to add golf club.');
      }

      const newClub = await response.json();
      setGolfClubs([...golfClubs, newClub]);
      setClubName('');
      setDistance('');
    } catch (err) {
      setError(err.message);
    }
  };

  const removeGolfClub = async (clubId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/GCWC/profile/${clubId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove golf club.');
      }

      setGolfClubs(golfClubs.filter((club) => club.id !== clubId));
    } catch (err) {
      setError(err.message);
    }
  };

  const editGolfClub = async (clubId, updatedName, updatedDistance) => {
    try {
      const response = await fetch(`${API_BASE_URL}/GCWC/profile/${clubId}/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ club_name: updatedName, distance: parseInt(updatedDistance, 10) }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit golf club.');
      }

      const updatedClub = await response.json();
      setGolfClubs(
        golfClubs.map((club) =>
          club.id === clubId ? { ...club, ...updatedClub } : club
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Profile</h1>
      <p><strong>Username:</strong> {userProfile.username}</p>
      <p><strong>Email:</strong> {userProfile.email}</p>

      <h2>Golf Clubs</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {golfClubs.length > 0 ? (
        <ul>
          {golfClubs.map((club) => (
            <li key={club.id}>
              {club.club_name} - {club.distance} yards
              <button onClick={() => removeGolfClub(club.id)} style={{ marginLeft: '10px', color: 'red' }}>
                Remove
              </button>
              <button
                onClick={() => {
                  const newName = prompt('Enter new club name:', club.club_name);
                  const newDistance = prompt('Enter new distance:', club.distance);
                  if (newName && newDistance) {
                    editGolfClub(club.id, newName, newDistance);
                  }
                }}
                style={{ marginLeft: '10px', color: 'blue' }}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No golf clubs in your bag.</p>
      )}

      <h2>Add a New Golf Club</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addGolfClub();
        }}
      >
        <input
          type="text"
          value={clubName}
          onChange={(e) => setClubName(e.target.value)}
          placeholder="Club Name"
          required
        />
        <input
          type="number"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          placeholder="Distance (yards)"
          required
        />
        <button type="submit">Add Club</button>
      </form>

      <div style={{ marginTop: '20px' }}>
        <Link href="/calculations">Go to Weather Calculations</Link>
      </div>
    </div>
  );
}