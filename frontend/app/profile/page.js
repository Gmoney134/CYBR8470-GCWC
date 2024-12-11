import { cookies } from 'next/headers';
import Link from 'next/link';
import ProfileClient from './ProfileClient'; // Import a client component

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
  const tokenCookie = await cookies();
  const token = tokenCookie.get('token')?.value;

  if (!token) {
    throw new Error('No valid session. Please log in.');
  }

  const userProfile = await fetchProfile();
  return <ProfileClient userProfile={userProfile} token={token}/>;
}
