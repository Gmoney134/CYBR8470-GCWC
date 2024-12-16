'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './profile.module.css'

const API_BASE_URL = 'http://localhost:8000';

export default function ProfileClient({ userProfile, token }) {
  const [golfClubs, setGolfClubs] = useState(userProfile.golf_clubs || []);
  const [clubName, setClubName] = useState('');
  const [distance, setDistance] = useState('');
  const [error, setError] = useState(null);

  const handleLogout = () => {
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/'; // Redirect to login page after logout
  };

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
    <div className={styles.pageContainer}>
      <button onClick={handleLogout} className={styles.logoutButton}>
        Logout
      </button>
      {/* Title and Navigation */}
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>Profile</h1>
        <Link href="/calculations">
          <button className={styles.calculationsButton}>Go to Weather Calculations</button>
        </Link>
      </div>

      {/* User Data */}
      <div className={styles.userData}>
        <p><strong>Username:</strong> {userProfile.username}</p>
        <p><strong>Email:</strong> {userProfile.email}</p>
      </div>

      {/* Golf Clubs */}
      <div className={styles.clubsContainer}>
        <div className={styles.addClubForm}>
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
          <button type="button" onClick={addGolfClub}>Add Club</button>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {golfClubs.length > 0 ? (
          golfClubs.map((club) => (
            <div key={club.id} className={styles.clubBox}>
              <span className={styles.clubDetails}>
                {club.club_name} - {club.distance} yards
              </span>
              <div className={styles.buttonsContainer}>
                <button
                  className={styles.editButton}
                  onClick={() => {
                    const newName = prompt('Enter new club name:', club.club_name);
                    const newDistance = prompt('Enter new distance:', club.distance);
                    if (newName && newDistance) {
                      editGolfClub(club.id, newName, newDistance);
                    }
                  }}
                >
                  Edit
                </button>
                <button className={styles.removeButton} onClick={() => removeGolfClub(club.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No golf clubs in your bag.</p>
        )}
      </div>
    </div>
  );
}