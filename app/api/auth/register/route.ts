import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/simple-session';
import { registerSchema } from '@/lib/utils/validation';
import { sql } from 'drizzle-orm';
import { apiHandler } from '@/lib/api/handler';
import { badRequest } from '@/lib/api/errors';

export const POST = apiHandler(
  { auth: 'none', schema: registerSchema },
  async (ctx) => {
    const validatedData = ctx.body as { username: string; email: string; password: string };

    // Check if username already exists
    const existingUsername = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, validatedData.username),
    });

    if (existingUsername) {
      badRequest('Username already taken');
    }

    // Check if email already exists
    const existingEmail = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validatedData.email),
    });

    if (existingEmail) {
      badRequest('Email already registered');
    }

    // Check if this is the first user (becomes admin)
    const userCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const isFirstUser = Number(userCount[0].count) === 0;

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username: validatedData.username,
        email: validatedData.email,
        passwordHash,
        role: isFirstUser ? 'admin' : 'candidate',
      })
      .returning();

    // Create session
    const session = await createSession(newUser.id);
    await setSessionCookie(session.id, session.expiresAt);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
        message: isFirstUser ? 'Admin account created successfully' : 'Account created successfully',
      },
      { status: 201 }
    );
  }
);
