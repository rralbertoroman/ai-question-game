import { NextResponse } from 'next/server';
import { validateRequest, deleteSession, clearSessionCookie } from '@/lib/auth/simple-session';

export async function POST() {
  try {
    const { session } = await validateRequest();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete session from database
    await deleteSession(session.id);

    // Clear session cookie
    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
