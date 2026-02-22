Add a new React component to the application.

## Instructions

1. Ask the user what the component should do and where it fits in the UI
2. Determine the correct subdirectory:
   - `components/auth/` — authentication-related UI
   - `components/game/` — gameplay UI (questions, timer, leaderboard, results)
   - `components/rooms/` — room listing and management
   - `components/hooks/` — custom React hooks
   - `components/icons/` — SVG icon components
   - `components/layout/` — header, footer, shared layout elements

### Implementation Steps

3. Decide server vs client component:
   - **Server component** (default): no interactivity needed, data fetching only
   - **Client component** (`'use client'`): forms, event handlers, state, effects, browser APIs
4. Create the component file following project conventions:
   - PascalCase filename matching component name (e.g., `MyComponent.tsx`)
   - Dark theme with cyan accent colors (`cyan-400`, `cyan-500`, `gray-800`, `gray-900`)
   - Tailwind CSS 4 for all styling
   - TypeScript with explicit prop types
5. If the directory has an `index.ts` barrel file (e.g., `components/icons/index.ts`, `components/layout/index.ts`), add the export there
6. Use a semantic commit: `feat(<area>): add <ComponentName> component`
