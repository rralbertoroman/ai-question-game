'use client';

import { useState, useCallback, useRef } from 'react';
import { GAME_CONFIG } from '@/lib/game/config';
import { usePolling } from '@/components/hooks/usePolling';
import { useToast } from '@/components/toast/useToast';
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
  const { addToast } = useToast();
  const failCountRef = useRef(0);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms);
        if (data.finishedRooms) {
          setFinishedRooms(data.finishedRooms);
        }
        failCountRef.current = 0;
      } else {
        failCountRef.current++;
        if (failCountRef.current === 2) {
          addToast('error', 'Having trouble refreshing room list');
        }
      }
    } catch {
      failCountRef.current++;
      if (failCountRef.current === 2) {
        addToast('error', 'Having trouble refreshing room list');
      }
    }
  }, [addToast]);

  const { trigger } = usePolling({
    callback: fetchRooms,
    intervalMs: GAME_CONFIG.ROOM_LIST_POLL_INTERVAL_MS,
  });

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
                onUpdate={trigger}
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
                  onUpdate={trigger}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
