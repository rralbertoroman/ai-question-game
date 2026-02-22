import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth/simple-session';
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import AdminSupervision from '@/components/game/AdminSupervision';

interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function SupervisePage({ params }: Props) {
  const { user } = await validateRequest();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/');

  const { roomId } = await params;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
  });

  if (!room) redirect('/');

  if (room.status === 'finished') {
    redirect(`/rooms/${roomId}/results`);
  }

  if (room.status !== 'playing') {
    redirect('/');
  }

  return <AdminSupervision roomId={roomId} roomName={room.name} />;
}
