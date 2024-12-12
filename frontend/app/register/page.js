import { redirect } from 'next/navigation';
import styles from '../page.module.css';

export default async function RegisterPage() {
  async function handleRegister(data) {
    'use server';

    const response = await fetch('http://backend:8000/GCWC/users/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: data.get('username'),
        email: data.get('email'),
        password: data.get('password'),
      }),
    });

    if (!response.ok) {
      throw new Error('Registration failed.');
    }

    redirect('/'); // Redirect to login page after successful registration
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Register</h1>
      <form action={handleRegister}>
        <input type="text" name="username" placeholder="Username" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
