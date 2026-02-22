import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/simple-session';
import { loginSchema } from '@/lib/utils/validation';
import { apiHandler } from '@/lib/api/handler';

export const POST = apiHandler(
  { auth: 'none', schema: loginSchema },
  async (ctx) => {
    const validatedData = ctx.body as { username: string; password: string };

    // Find user by username
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, validatedData.username),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await verifyPassword(
      user.passwordHash,
      validatedData.password
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(user.id);
    await setSessionCookie(session.id, session.expiresAt);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  }
);
