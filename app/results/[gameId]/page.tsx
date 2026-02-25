import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth/simple-session';
import { db } from '@/lib/db';
import { games } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { findParticipant } from '@/lib/db/repositories/participants';
import { getGameResults, getLeaderboard } from '@/lib/game/engine';
import ResultsView from '@/components/game/ResultsView';

interface Props {
  params: Promise<{ gameId: string }>;
}

export default async function ResultsPage({ params }: Props) {
  const { user } = await validateRequest();
  if (!user) redirect('/login');

  const { gameId: gameIdStr } = await params;
  const gameId = parseInt(gameIdStr, 10);

  if (isNaN(gameId)) redirect('/');

  // Verify game exists
  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
  });

  if (!game) redirect('/');

  // Check access: must be participant or admin
  const participant = await findParticipant(gameId, user.id);
  if (!participant && user.role !== 'admin') redirect('/');

  const results = await getGameResults(gameId);
  const leaderboard = await getLeaderboard(gameId);

  return (
    <ResultsView
      gameId={gameId}
      results={JSON.parse(JSON.stringify(results))}
      leaderboard={JSON.parse(JSON.stringify(leaderboard))}
      currentUserId={user.id}
    />
  );
}
