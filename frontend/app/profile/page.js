import { cookies } from 'next/headers';

const API_BASE_URL = 'http://backend:8000';

async function fetchUserProfile(token) {
  const response = await fetch(`${API_BASE_URL}/GCWC/users/`, {
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
    const tokenCookie = await cookies();
    const token = tokenCookie.get('token')?.value;

  if (!token) {
    throw new Error('No valid session. Please log in.');
  }

  const userProfile = await fetchUserProfile(token);

  return (
    <div>
      <h1>Profile</h1>
      <p>Username: {userProfile.username}</p>
      <p>Email: {userProfile.email}</p>
    </div>
  );
}
