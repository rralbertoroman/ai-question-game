import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth/simple-session';
import { db } from '@/lib/db';
import { rooms, roomParticipants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGameResults, getLeaderboard } from '@/lib/game/engine';
import ResultsView from '@/components/game/ResultsView';

interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function ResultsPage({ params }: Props) {
  const { user } = await validateRequest();
  if (!user) redirect('/login');

  const { roomId } = await params;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
  });

  if (!room) redirect('/');

  // Verify participant
  const participant = await db.query.roomParticipants.findFirst({
    where: and(
      eq(roomParticipants.roomId, roomId),
      eq(roomParticipants.userId, user.id)
    ),
  });

  if (!participant && user.role !== 'admin') redirect('/');

  const results = await getGameResults(roomId);
  const leaderboard = await getLeaderboard(roomId);

  return (
    <ResultsView
      roomName={room.name}
      results={JSON.parse(JSON.stringify(results))}
      leaderboard={JSON.parse(JSON.stringify(leaderboard))}
      currentUserId={user.id}
    />
  );
}
