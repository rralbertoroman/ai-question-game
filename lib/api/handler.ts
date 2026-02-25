import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireAdmin, type SessionUser } from '@/lib/auth/simple-session';
import { ApiError } from '@/lib/api/errors';

export interface ApiContext {
  request: NextRequest;
  user: SessionUser;
  body: unknown;
}

export type HandlerOptions = {
  auth: 'none' | 'user' | 'admin';
  schema?: z.ZodType;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteParams = { params: Promise<any> };

type HandlerFn = (ctx: Partial<ApiContext>) => Promise<NextResponse | Response>;

export function apiHandler(
  options: HandlerOptions,
  handler: HandlerFn
): (request: NextRequest, props?: RouteParams) => Promise<NextResponse | Response> {
  return async (request: NextRequest, props?: RouteParams) => {
    try {
      const ctx: Partial<ApiContext> & { params?: Record<string, string> } = { request };

      // Auth
      if (options.auth === 'admin') {
        ctx.user = await requireAdmin();
      } else if (options.auth === 'user') {
        ctx.user = await requireAuth();
      }

      // Extract route params if present (for routes like /api/game/[gameId]/results)
      if (props?.params) {
        ctx.params = await props.params;
      }

      // Body parsing + validation
      if (options.schema) {
        const body = await request.json();
        ctx.body = options.schema.parse(body);
      }

      return await handler(ctx);
    } catch (error) {
      // ApiError (domain errors)
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      // Zod validation errors
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Error de validación', details: error.issues },
          { status: 400 }
        );
      }

      // Auth errors thrown by requireAuth / requireAdmin
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message === 'Forbidden: Admin access required') {
          return NextResponse.json(
            { error: 'Se requiere acceso de administrador' },
            { status: 403 }
          );
        }
      }

      // Fallback
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  };
}
