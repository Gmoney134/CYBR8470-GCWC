import CalculationsClient from './CalculationsClient';
import { cookies } from 'next/headers';

export default async function CalculationsPage() {
  const tokenCookie = await cookies();
  const token = tokenCookie.get('token')?.value; 

  if (!token) {
    return <div>No valid session. Please log in.</div>;
  }

  return <CalculationsClient token={token} />;
}