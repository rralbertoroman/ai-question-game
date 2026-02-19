import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth/simple-session';
import { db } from '@/lib/db';
import { rooms, roomParticipants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import GamePlay from '@/components/game/GamePlay';

interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function PlayPage({ params }: Props) {
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

  if (!participant) redirect('/');

  if (room.status === 'finished') {
    redirect(`/rooms/${roomId}/results`);
  }

  if (room.status !== 'playing') {
    redirect('/');
  }

  return <GamePlay roomId={roomId} userId={user.id} />;
}
