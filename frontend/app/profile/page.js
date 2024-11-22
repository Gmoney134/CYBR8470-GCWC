import { cookies } from 'next/headers';

const API_BASE_URL = 'http://backend:8000';

async function fetchProfile() {
  const tokenCookie = await cookies();
  const token = tokenCookie.get('token')?.value;

  if (!token) {
    throw new Error('No valid session. Please log in.');
  }

  const response = await fetch(`${API_BASE_URL}/GCWC/profile/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });


  if (!response.ok) {
    const error = await response.text(); // Log the backend error
    console.error('Backend error response:', error);
    throw new Error('Failed to fetch user profile. Please check your token.');
  }

  return response.json();
}

export default async function ProfilePage() {
  const userProfile = await fetchProfile();

  return (
    <div>
      <h1>Profile</h1>
      <p><strong>Username:</strong> {userProfile.username}</p>
      <p><strong>Email:</strong> {userProfile.email}</p>

      <h2>Golf Clubs</h2>
      {userProfile.golf_clubs.length > 0 ? (
        <ul>
          {userProfile.golf_clubs.map((club) => (
            <li key={club.id}>
              {club.club_name} - {club.distance} yards
            </li>
          ))}
        </ul>
      ) : (
        <p>No golf clubs in your bag.</p>
      )}
    </div>
  );
}

