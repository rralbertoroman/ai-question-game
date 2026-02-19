import { cookies } from 'next/headers';
import { cache } from 'react';
import { db } from '@/lib/db';
import { users, sessions } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Session cookie configuration
const SESSION_COOKIE_NAME = 'auth_session';
const SESSION_DURATION_DAYS = 30;

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

export type Session = {
  id: string;
  userId: number;
  expiresAt: Date;
};

export type SessionValidationResult =
  | { user: SessionUser; session: Session }
  | { user: null; session: null };

/**
 * Create a new session for a user
 */
export async function createSession(userId: number): Promise<Session> {
  const sessionId = nanoid(40);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return {
    id: sessionId,
    userId,
    expiresAt,
  };
}

/**
 * Validate a session by ID
 */
export async function validateSessionById(sessionId: string): Promise<SessionValidationResult> {
  try {
    // Query session with user join
    const result = await db
      .select({
        sessionId: sessions.id,
        sessionUserId: sessions.userId,
        sessionExpiresAt: sessions.expiresAt,
        userId: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.id, sessionId),
          gt(sessions.expiresAt, new Date()) // Only get non-expired sessions
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { user: null, session: null };
    }

    const row = result[0];

    return {
      session: {
        id: row.sessionId,
        userId: row.sessionUserId,
        expiresAt: row.sessionExpiresAt,
      },
      user: {
        id: row.userId,
        username: row.username,
        email: row.email,
        role: row.role,
      },
    };
  } catch (error) {
    console.error('[Auth] Session validation error:', error);
    return { user: null, session: null };
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Delete all sessions for a user
 */
export async function deleteUserSessions(userId: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Set session cookie
 */
export async function setSessionCookie(sessionId: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
}

/**
 * Get session ID from cookies
 */
export async function getSessionIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Validate current session from cookies
 * Cached per request to avoid multiple DB calls
 */
export const validateRequest = cache(async (): Promise<SessionValidationResult> => {
  const sessionId = await getSessionIdFromCookie();

  if (!sessionId) {
    return { user: null, session: null };
  }

  return validateSessionById(sessionId);
});

/**
 * Get current user or null
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const { user } = await validateRequest();
  return user;
}

/**
 * Require authenticated user or throw
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Require admin role or throw
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}
