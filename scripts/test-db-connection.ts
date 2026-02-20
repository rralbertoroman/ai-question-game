import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { users, sessions } from '@/lib/db/schema';

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Test basic query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✓ Basic query successful');

    // Test users count
    const userCount = await db.select().from(users);
    console.log(`✓ Found ${userCount.length} users`);

    // Test sessions count
    const sessionCount = await db.select().from(sessions);
    console.log(`✓ Found ${sessionCount.length} sessions`);

    // Test session-user join query
    const sessionId = '3cjsg7hejc34g7vi4sqq2nflpiupmmohfoplgyym';
    const joinResult = await db
      .select()
      .from(sessions)
      .innerJoin(users, sql`${sessions.userId} = ${users.id}`)
      .where(sql`${sessions.id} = ${sessionId}`);

    console.log('✓ Join query successful');
    console.log('Result:', JSON.stringify(joinResult, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('✗ Database test failed:', error);
    process.exit(1);
  }
}

testConnection();
