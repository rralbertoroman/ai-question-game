'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InlineError from '@/components/error/InlineError';

export default function CreateRoomButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [participantLimit, setParticipantLimit] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, participantLimit }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      setName('');
      setParticipantLimit(6);
      setIsOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mb-6 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
      >
        + Create Room
      </button>
    );
  }

  return (
    <div className="mb-6 p-6 bg-gray-800/50 border border-gray-700 rounded-lg animate-fade-in-up">
      <h3 className="text-lg font-semibold text-white mb-4">Create New Room</h3>

      <InlineError message={error} className="mb-4" onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Room Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AI Challenge Round 1"
            required
            minLength={3}
            maxLength={100}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Participant Limit
          </label>
          <input
            type="number"
            value={participantLimit}
            onChange={(e) => setParticipantLimit(Number(e.target.value))}
            min={2}
            max={20}
            className="w-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setError('');
            }}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
