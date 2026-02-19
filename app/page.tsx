import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth/session';

export default async function Home() {
  const { user } = await validateRequest();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">
            Rooms
          </h1>
          <span className="text-gray-400">
            Welcome, {user.username}
          </span>
        </div>
        <p className="text-gray-400">
          No rooms available yet.
        </p>
      </div>
    </div>
  );
}
