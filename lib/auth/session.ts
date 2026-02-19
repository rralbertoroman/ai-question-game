import { cookies } from 'next/headers';
import { cache } from 'react';
import type { Session, User } from 'lucia';
import { lucia } from './lucia';

/**
 * Validate session from cookies
 * Cached per request to avoid multiple DB calls
 */
export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    try {
      const result = await lucia.validateSession(sessionId);

      // Refresh session if needed
      try {
        if (result.session && result.session.fresh) {
          const sessionCookie = lucia.createSessionCookie(result.session.id);
          (await cookies()).set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
          );
        }
        if (!result.session) {
          const sessionCookie = lucia.createBlankSessionCookie();
          (await cookies()).set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
          );
        }
      } catch {
        // Next.js throws when trying to set cookies during RSC
        // This is expected behavior
      }

      return result;
    } catch (error) {
      console.error('[Auth] Session validation failed:', {
        sessionId: sessionId.substring(0, 10) + '...', // Truncated for security
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        user: null,
        session: null,
      };
    }
  }
);

/**
 * Get current user or null
 */
export async function getCurrentUser(): Promise<User | null> {
  const { user } = await validateRequest();
  return user;
}

/**
 * Require authenticated user or throw
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Require admin role or throw
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}
