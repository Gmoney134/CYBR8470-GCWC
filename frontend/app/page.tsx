import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';


const API_BASE_URL = 'http://backend:8000';

export async function handleLogin(formData: any[]) {
  'use server';
  let redirectPath: string | null = null

  const { username, password } = Object.fromEntries(formData.entries());
  const loginUrl = `${API_BASE_URL}/GCWC/login/`;

  try {
    console.log('Attempting login with URL:', loginUrl);
    console.log('Payload:', { username, password });

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error:', error);
      throw new Error(error.detail || 'Failed to authenticate');
    }

    const data = await response.json();

    // Set the cookie securely
    (await
      cookies()).set('token', data.access, {
      path: '/',
      httpOnly: true,
    });

    redirectPath = `/profile`
  } catch (error) {
    console.error('Login failed:', error); // Log the full error object
    throw new Error(`Error during login: ${error.message || 'Unknown error'}. Check console for details.`);
    redirectPath = `/`
  } finally {
    //Clear resources
    if (redirectPath)
        redirect(redirectPath)
}
}

export default function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <form action={handleLogin}>
        <input type="text" name="username" placeholder="Username" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <Link href="/register">Register here</Link>
      </p>
    </div>
  );
}
