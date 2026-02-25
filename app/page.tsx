import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth/simple-session';
import LogoutButton from '@/components/auth/LogoutButton';
import { AiChipIcon } from '@/components/icons';
import AdminDashboard from '@/components/admin/AdminDashboard';
import CandidateView from '@/components/candidate/CandidateView';

export default async function Home() {
  const { user } = await validateRequest();
  if (!user) {
    redirect('/login');
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/95 to-black/95 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <AiChipIcon size={32} className="text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-gradient-animated">AI Challenge</h1>
              <p className="text-sm text-gray-500">Día Tecnológico: AI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LogoutButton />
          </div>
        </div>

        {isAdmin ? (
          <AdminDashboard username={user.username} />
        ) : (
          <CandidateView currentUserId={user.id} username={user.username} />
        )}
      </div>
    </div>
  );
}
