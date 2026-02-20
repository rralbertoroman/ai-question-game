'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  room: Room;
  currentUser: { id: number; role: string; username: string };
  onUpdate: () => void;
}

export default function RoomCard({ room, currentUser, onUpdate }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isAdmin = currentUser.role === 'admin';
  const isParticipant = room.participants.some(
    (p) => p.userId === currentUser.id
  );
  const myParticipant = room.participants.find(
    (p) => p.userId === currentUser.id
  );
  const isFull = room.participants.length >= room.participantLimit;
  const readyCount = room.participants.filter((p) => p.ready).length;
  const allReady =
    readyCount === room.participants.length && room.participants.length >= 2;

  const doAction = async (
    action: string,
    method: string = 'POST',
    url?: string
  ) => {
    setLoading(action);
    setError('');
    try {
      const res = await fetch(url || `/api/rooms/${room.id}/${action}`, {
        method,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action}`);

      if (data.gameStarted) {
        router.push(`/rooms/${room.id}/play`);
        return;
      }

      onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setLoading(null);
    }
  };

  const statusColor: Record<string, string> = {
    open: 'bg-green-500/20 text-green-400 border-green-500/50',
    playing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    finished: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    closed: 'bg-red-500/20 text-red-400 border-red-500/50',
  };

  return (
    <div className="p-5 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 card-hover-lift">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{room.name}</h3>
          <p className="text-sm text-gray-500">by {room.admin.username}</p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded border ${statusColor[room.status] || statusColor.closed}`}
        >
          {room.status}
        </span>
      </div>

      {/* Participants */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">
          Players: {room.participants.length}/{room.participantLimit}
          {allReady && room.status === 'open' && (
            <span className="ml-2 text-cyan-400 font-semibold">
              All Ready!
            </span>
          )}
        </p>
        {room.participants.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {room.participants.map((p) => (
              <span
                key={p.id}
                className={`text-xs px-2 py-1 rounded ${
                  p.ready
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-gray-700 text-gray-400 border border-gray-600'
                }`}
              >
                {p.user.username}
                {p.ready && ' \u2713'}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {room.status === 'open' && (
          <>
            {/* Candidate/Player actions */}
            {!isParticipant && !isFull && (
              <button
                onClick={() => doAction('join')}
                disabled={loading !== null}
                className="px-4 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {loading === 'join' ? 'Joining...' : 'Join'}
              </button>
            )}

            {isParticipant && (
              <>
                <button
                  onClick={() => doAction('ready')}
                  disabled={loading !== null}
                  className={`px-4 py-1.5 text-sm rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    myParticipant?.ready
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {loading === 'ready'
                    ? 'Updating...'
                    : myParticipant?.ready
                      ? 'Ready \u2713'
                      : 'Ready?'}
                </button>

                <button
                  onClick={() => doAction('retire')}
                  disabled={loading !== null}
                  className="px-4 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'retire' ? 'Leaving...' : 'Leave'}
                </button>
              </>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <button
                onClick={() => doAction('start')}
                disabled={loading !== null || room.participants.length < 2}
                className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {loading === 'start' ? 'Starting...' : 'Start Game'}
              </button>
            )}
          </>
        )}

        {room.status === 'playing' && (
          <>
            {isParticipant && (
              <button
                onClick={() => router.push(`/rooms/${room.id}/play`)}
                className="px-4 py-1.5 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors cursor-pointer"
              >
                Enter Game
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => doAction('finish')}
                disabled={loading !== null}
                className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'finish' ? 'Finishing...' : 'End Game'}
              </button>
            )}
          </>
        )}

        {/* Admin delete - always available */}
        {isAdmin && (
          <button
            onClick={() => {
              if (confirm('Delete this room? This cannot be undone.')) {
                doAction('delete', 'DELETE', `/api/rooms/${room.id}`);
              }
            }}
            disabled={loading !== null}
            className="px-4 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            {loading === 'delete' ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}
