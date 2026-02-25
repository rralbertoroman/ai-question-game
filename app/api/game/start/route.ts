import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { getActiveGame, getOnlinePlayers, initializeGame } from '@/lib/game/engine';

export const POST = apiHandler(
  { auth: 'admin' },
  async () => {
    // Check no game is already active
    const activeGame = await getActiveGame();
    if (activeGame) {
      return NextResponse.json(
        { error: 'Ya hay un juego en curso' },
        { status: 409 }
      );
    }

    // Get online players
    const players = await getOnlinePlayers();
    if (players.length < 2) {
      return NextResponse.json(
        { error: 'Se necesitan al menos 2 jugadores conectados' },
        { status: 400 }
      );
    }

    const playerIds = players.map((p) => p.id);
    const gameId = await initializeGame(playerIds);

    return NextResponse.json({ success: true, gameId }, { status: 201 });
  }
);
