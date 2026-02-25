import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { getGlobalLeaderboard } from '@/lib/game/engine';

export const GET = apiHandler(
  { auth: 'user' },
  async () => {
    const leaderboard = await getGlobalLeaderboard();
    return NextResponse.json({ leaderboard });
  }
);
