import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'auth_session';

// Paths accessible without authentication
const publicPaths = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicPaths.some((path) =>
    pathname.startsWith(path)
  );

  // Only check cookie presence — actual DB validation happens in server-side layouts
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!isPublic && !sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
