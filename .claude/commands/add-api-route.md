Add a new API route to the application.

## Instructions

1. Read `docs/api-routes.md` for the current route inventory
2. Read `app/api/rooms/route.ts` as the canonical pattern for route structure
3. Ask the user what the route should do, its path, and HTTP method(s)

### Implementation Steps

4. Create the route file at the appropriate path under `app/api/`
5. Follow this pattern:
   - Import `NextRequest`, `NextResponse` from `next/server`
   - Import auth helpers from `@/lib/auth/simple-session` (`requireAuth` or `requireAdmin`)
   - Import Zod from `zod` if request body validation is needed
   - Use try/catch with proper error discrimination (ZodError → 400, Unauthorized → 401, Forbidden → 403)
   - Use Drizzle query builder for all DB operations
6. If the route accepts a request body, add a Zod schema to `lib/utils/validation.ts`
7. For dynamic routes: remember Next.js 16 params are `Promise<{}>` — must `await params`
8. Update `docs/api-routes.md` with the new route entry
9. Use a semantic commit: `feat(api): add <route description>`
