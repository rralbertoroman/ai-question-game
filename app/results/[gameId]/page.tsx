import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth/simple-session';
import { getGameResults } from '@/lib/game/engine';
import ResultsView from '@/components/game/ResultsView';

async function loadResults(id: number) {
  try {
    return await getGameResults(id);
  } catch {
    return null;
  }
}

export default async function ResultsPage(props: { params: Promise<{ gameId: string }> }) {
  const { user } = await validateRequest();
  if (!user) {
    redirect('/login');
  }

  const { gameId } = await props.params;
  const id = parseInt(gameId, 10);

  if (isNaN(id)) {
    redirect('/');
  }

  const results = await loadResults(id);
  if (!results) {
    redirect('/');
  }

  return (
    <ResultsView
      results={results}
      leaderboard={results.leaderboard}
      currentUserId={user.id}
    />
  );
}
