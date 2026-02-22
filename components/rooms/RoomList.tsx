'use client';

import { useState, useEffect, useCallback } from 'react';
import RoomCard from './RoomCard';

interface Participant {
  id: number;
  userId: number;
  ready: boolean;
  user: { id: number; username: string };
}

interface Room {
  id: string;
  name: string;
  adminId: number;
  participantLimit: number;
  status: string;
  createdAt: string;
  admin: { id: number; username: string };
  participants: Participant[];
}

interface Props {
  initialRooms: Room[];
  initialFinishedRooms?: Room[];
  currentUser: { id: number; role: string; username: string };
}

export default function RoomList({ initialRooms, initialFinishedRooms = [], currentUser }: Props) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [finishedRooms, setFinishedRooms] = useState<Room[]>(initialFinishedRooms);
  const isAdmin = currentUser.role === 'admin';

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms);
        if (data.finishedRooms) {
          setFinishedRooms(data.finishedRooms);
        }
      }
    } catch {
      // Silently retry on next interval
    }
  }, []);

  // Poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  if (rooms.length === 0 && finishedRooms.length === 0) {
    return (
      <p className="text-gray-500 text-center py-12">
        No rooms available yet.
      </p>
    );
  }

  return (
    <>
      {rooms.length > 0 && (
        <div className="grid gap-4">
          {rooms.map((room, index) => (
            <div
              key={room.id}
              className="animate-stagger-in"
              style={{ '--i': index } as React.CSSProperties}
            >
              <RoomCard
                room={room}
                currentUser={currentUser}
                onUpdate={fetchRooms}
              />
            </div>
          ))}
        </div>
      )}

      {isAdmin && finishedRooms.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-400 mb-4">Finished Games</h2>
          <div className="grid gap-4">
            {finishedRooms.map((room, index) => (
              <div
                key={room.id}
                className="animate-stagger-in"
                style={{ '--i': index } as React.CSSProperties}
              >
                <RoomCard
                  room={room}
                  currentUser={currentUser}
                  onUpdate={fetchRooms}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
