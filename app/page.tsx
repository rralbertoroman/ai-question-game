import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth/simple-session';
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { ne, eq } from 'drizzle-orm';
import RoomList from '@/components/rooms/RoomList';
import CreateRoomButton from '@/components/rooms/CreateRoomButton';
import LogoutButton from '@/components/auth/LogoutButton';
import { AiChipIcon } from '@/components/icons';

export default async function Home() {
  const { user } = await validateRequest();
  if (!user) {
    redirect('/login');
  }

  const allRooms = await db.query.rooms.findMany({
    where: ne(rooms.status, 'finished'),
    with: {
      participants: {
        with: { user: { columns: { id: true, username: true } } },
      },
      admin: { columns: { id: true, username: true } },
    },
    orderBy: (rooms, { desc }) => [desc(rooms.createdAt)],
  });

  const isAdmin = user.role === 'admin';

  let finishedRooms: typeof allRooms = [];
  if (isAdmin) {
    finishedRooms = await db.query.rooms.findMany({
      where: eq(rooms.status, 'finished'),
      with: {
        participants: {
          with: { user: { columns: { id: true, username: true } } },
        },
        admin: { columns: { id: true, username: true } },
      },
      orderBy: (rooms, { desc }) => [desc(rooms.createdAt)],
      limit: 20,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/95 to-black/95 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <AiChipIcon size={32} className="text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-gradient-animated">Challenge Rooms</h1>
              <p className="text-sm text-gray-500">Día Tecnológico: AI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              Welcome, {user.username}
              {isAdmin && (
                <span className="ml-2 text-xs bg-cyan-600 text-white px-2 py-0.5 rounded">
                  Admin
                </span>
              )}
            </span>
            <LogoutButton />
          </div>
        </div>

        {isAdmin && <CreateRoomButton />}

        <RoomList
          initialRooms={JSON.parse(JSON.stringify(allRooms))}
          initialFinishedRooms={JSON.parse(JSON.stringify(finishedRooms))}
          currentUser={{
            id: user.id,
            role: user.role,
            username: user.username,
          }}
        />
      </div>
    </div>
  );
}
