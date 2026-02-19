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
  currentUser: { id: number; role: string; username: string };
}

export default function RoomList({ initialRooms, currentUser }: Props) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms);
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

  if (rooms.length === 0) {
    return (
      <p className="text-gray-500 text-center py-12">
        No rooms available yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          currentUser={currentUser}
          onUpdate={fetchRooms}
        />
      ))}
    </div>
  );
}
