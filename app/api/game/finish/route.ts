import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { getActiveGame, finishGame } from '@/lib/game/engine';

export const POST = apiHandler(
  { auth: 'admin' },
  async () => {
    const activeGame = await getActiveGame();
    if (!activeGame) {
      return NextResponse.json(
        { error: 'No hay juego en curso' },
        { status: 404 }
      );
    }

    await finishGame(activeGame.id);

    return NextResponse.json({ success: true });
  }
);
