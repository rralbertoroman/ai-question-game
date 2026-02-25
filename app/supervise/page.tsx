import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth/simple-session';
import { getActiveGame } from '@/lib/game/engine';
import AdminSupervision from '@/components/game/AdminSupervision';

export default async function SupervisePage() {
  const { user } = await validateRequest();
  if (!user) redirect('/login');

  // Only admins can access supervision
  if (user.role !== 'admin') redirect('/');

  // Must have an active game
  const activeGame = await getActiveGame();
  if (!activeGame) redirect('/');

  return <AdminSupervision gameId={activeGame.id} />;
}
