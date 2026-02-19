import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth/simple-session';

export const metadata: Metadata = {
  title: 'Authentication - LLM Quiz Game',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirect to home if already logged in
  const { user } = await validateRequest();
  if (user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      {children}
    </div>
  );
}
