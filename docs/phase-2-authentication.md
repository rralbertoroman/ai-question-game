# Phase 2: Authentication System

## Overview
Implement a complete authentication system using Lucia Auth with session-based authentication. The system will support user registration, login, logout, and automatic admin role assignment for the first user.

## Goals
- Secure password-based authentication
- Session management with secure cookies
- First registered user becomes admin automatically
- Protected routes via Next.js middleware
- Type-safe authentication throughout the app

---

## Files to Create

### 1. Authentication Library (`lib/auth/`)

#### `lib/auth/lucia.ts`
**Purpose:** Configure Lucia authentication with PostgreSQL adapter

```typescript
import { Lucia } from 'lucia';
import { PostgresAdapter } from '@lucia-auth/adapter-postgresql';
import postgres from 'postgres';
import { users, sessions } from '../db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const queryClient = postgres(process.env.DATABASE_URL);

// Create Lucia adapter for PostgreSQL
const adapter = new PostgresAdapter(queryClient, {
  user: 'users',
  session: 'sessions'
});

// Initialize Lucia
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      email: attributes.email,
      role: attributes.role,
    };
  },
});

// Type declarations for Lucia
declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      username: string;
      email: string;
      role: string;
    };
  }
}
```

#### `lib/auth/password.ts`
**Purpose:** Password hashing and verification using Argon2

```typescript
import { hash, verify } from '@node-rs/argon2';

// Argon2 configuration
const hashOptions = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, hashOptions);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  return await verify(hash, password);
}
```

#### `lib/auth/session.ts`
**Purpose:** Session validation and user retrieval helpers

```typescript
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
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    const result = await lucia.validateSession(sessionId);

    // Refresh session if needed
    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(
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
```

---

### 2. Validation Schemas (`lib/utils/validation.ts`)

```typescript
import { z } from 'zod';

/**
 * Registration form validation schema
 */
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password is too long'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

---

### 3. API Routes (`app/api/auth/`)

#### `app/api/auth/register/route.ts`
**Purpose:** Handle user registration with first-user admin detection

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { lucia } from '@/lib/auth/lucia';
import { registerSchema } from '@/lib/utils/validation';
import { cookies } from 'next/headers';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Check if username already exists
    const existingUsername = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, validatedData.username),
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validatedData.email),
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
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
    const session = await lucia.createSession(newUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
```

#### `app/api/auth/login/route.ts`
**Purpose:** Handle user login and session creation

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { lucia } from '@/lib/auth/lucia';
import { loginSchema } from '@/lib/utils/validation';
import { cookies } from 'next/headers';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validatedData.email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
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
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
```

#### `app/api/auth/logout/route.ts`
**Purpose:** Handle user logout and session invalidation

```typescript
import { NextResponse } from 'next/server';
import { lucia } from '@/lib/auth/lucia';
import { validateRequest } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const { session } = await validateRequest();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Invalidate session
    await lucia.invalidateSession(session.id);

    // Clear session cookie
    const sessionCookie = lucia.createBlankSessionCookie();
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
```

#### `app/api/auth/session/route.ts`
**Purpose:** Get current session and user info

```typescript
import { NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth/session';

export async function GET() {
  try {
    const { user, session } = await validateRequest();

    if (!user || !session) {
      return NextResponse.json(
        { user: null, session: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
```

---

### 4. Middleware (`middleware.ts`)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateRequest } from '@/lib/auth/session';

// Paths that require authentication
const protectedPaths = ['/rooms', '/admin'];

// Paths that require admin role
const adminPaths = ['/admin'];

// Public paths (accessible without auth)
const publicPaths = ['/', '/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path requires authentication
  const requiresAuth = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  const requiresAdmin = adminPaths.some((path) =>
    pathname.startsWith(path)
  );

  // Validate session
  const { user } = await validateRequest();

  // Redirect to login if authentication required but not logged in
  if (requiresAuth && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin access
  if (requiresAdmin && user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/rooms', request.url));
  }

  // Add user info to request headers for API routes
  const requestHeaders = new Headers(request.headers);
  if (user) {
    requestHeaders.set('x-user-id', user.id.toString());
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-username', user.username);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

---

### 5. Authentication Forms

#### `app/(auth)/layout.tsx`
**Purpose:** Layout for auth pages

```typescript
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Authentication - LLM Quiz Game',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirect to rooms if already logged in
  const { user } = await validateRequest();
  if (user) {
    redirect('/rooms');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
      {children}
    </div>
  );
}
```

#### `app/(auth)/register/page.tsx`
**Purpose:** Registration page

```typescript
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Create Account
        </h1>
        <p className="text-gray-400">
          Join the LLM Quiz Game
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
```

#### `app/(auth)/login/page.tsx`
**Purpose:** Login page

```typescript
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-400">
          Sign in to your account
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
```

#### `components/auth/RegisterForm.tsx`
**Purpose:** Client-side registration form

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Show success message if first user
      if (data.message?.includes('Admin')) {
        alert('🎉 You are the first user and have been granted admin privileges!');
      }

      router.push('/rooms');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
          required
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded transition-colors"
      >
        {loading ? 'Creating Account...' : 'Register'}
      </button>

      <p className="text-center text-gray-400 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-cyan-500 hover:text-cyan-400">
          Sign in
        </Link>
      </p>
    </form>
  );
}
```

#### `components/auth/LoginForm.tsx`
**Purpose:** Client-side login form

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/rooms';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded transition-colors"
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>

      <p className="text-center text-gray-400 text-sm">
        Don't have an account?{' '}
        <Link href="/register" className="text-cyan-500 hover:text-cyan-400">
          Register
        </Link>
      </p>
    </form>
  );
}
```

---

## Implementation Checklist

- [ ] Install @node-rs/argon2 for password hashing
- [ ] Create lib/auth/lucia.ts - Lucia configuration
- [ ] Create lib/auth/password.ts - Password hashing utilities
- [ ] Create lib/auth/session.ts - Session validation helpers
- [ ] Create lib/utils/validation.ts - Zod schemas
- [ ] Create app/api/auth/register/route.ts - Registration endpoint
- [ ] Create app/api/auth/login/route.ts - Login endpoint
- [ ] Create app/api/auth/logout/route.ts - Logout endpoint
- [ ] Create app/api/auth/session/route.ts - Session info endpoint
- [ ] Create middleware.ts - Route protection
- [ ] Create app/(auth)/layout.tsx - Auth layout
- [ ] Create app/(auth)/register/page.tsx - Register page
- [ ] Create app/(auth)/login/page.tsx - Login page
- [ ] Create components/auth/RegisterForm.tsx - Register form component
- [ ] Create components/auth/LoginForm.tsx - Login form component
- [ ] Test registration flow (first user becomes admin)
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test protected routes redirect to login
- [ ] Test admin-only routes

---

## Testing Scenarios

### 1. First User Registration
```bash
# Should create user with admin role
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Expected: { success: true, user: { role: "admin" }, message: "Admin account created..." }
```

### 2. Second User Registration
```bash
# Should create user with candidate role
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player1",
    "email": "player1@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Expected: { success: true, user: { role: "candidate" } }
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Expected: { success: true, user: { ... } }
# Should set session cookie
```

### 4. Protected Route Access
- Visit `/rooms` without login → Redirect to `/login?redirect=/rooms`
- Visit `/admin` without login → Redirect to `/login`
- Visit `/admin` as candidate → Redirect to `/rooms`
- Visit `/admin` as admin → Access granted

---

## Security Considerations

1. **Password Hashing**
   - Uses Argon2id (most secure variant)
   - Memory cost: 19456 KB
   - Time cost: 2 iterations
   - Output length: 32 bytes

2. **Session Security**
   - HTTP-only cookies (no JavaScript access)
   - Secure flag in production (HTTPS only)
   - SameSite=lax (CSRF protection)
   - 30-day expiration with automatic refresh

3. **Input Validation**
   - Zod schemas validate all inputs
   - Username: alphanumeric + underscore only
   - Password: minimum 8 characters
   - Email: proper format validation

4. **Error Handling**
   - Generic "Invalid email or password" for login (no user enumeration)
   - Specific errors for registration (user experience)
   - Never expose internal errors to client

---

## Dependencies Required

```bash
pnpm add @node-rs/argon2
```

---

## Notes

- Lucia and Oslo packages show deprecation warnings but are still functional
- First user detection uses `COUNT(*)` query before insertion
- Session cookies are refreshed automatically when "fresh"
- Middleware runs on all routes except API auth endpoints and static files
- Type definitions extend Lucia's `Register` interface for type safety
