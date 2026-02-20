import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Prevent multiple postgres clients during hot reloading in development
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
  // eslint-disable-next-line no-var
  var __queryClient: ReturnType<typeof postgres> | undefined;
}

// Create postgres connection (reuse in development to prevent connection exhaustion)
let queryClient: ReturnType<typeof postgres>;

if (process.env.NODE_ENV === 'production') {
  // Neon pooled connections (via PgBouncer) require prepare: false
  queryClient = postgres(process.env.DATABASE_URL, { prepare: false });
} else {
  if (!globalThis.__queryClient) {
    globalThis.__queryClient = postgres(process.env.DATABASE_URL);
  }
  queryClient = globalThis.__queryClient;
}

// Create drizzle instance with schema (reuse in development)
export const db =
  process.env.NODE_ENV === 'production' || !globalThis.__db
    ? drizzle(queryClient, { schema })
    : globalThis.__db;

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = db;
}

// Export schema for convenience
export * from './schema';
