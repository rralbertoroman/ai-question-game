import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiHandler } from '@/lib/api/handler';

export const POST = apiHandler(
  { auth: 'user' },
  async (ctx) => {
    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, ctx.user!.id));

    return NextResponse.json({ ok: true });
  }
);
