Make a database schema change with migration.

## Instructions

1. Read `lib/db/schema.ts` to understand the current schema
2. Ask the user what schema change they need (new table, new column, modify column, etc.)

### Implementation Steps

3. Edit `lib/db/schema.ts` with the change:
   - Add/modify table definitions
   - Add/modify relations if needed
   - Add appropriate indexes
4. Run `pnpm db:generate` to generate the Drizzle migration file
5. Review the generated SQL in `drizzle/` to confirm it matches intent
6. Run `pnpm db:migrate` to apply the migration
7. Update `docs/architecture.md` database schema section if the change is significant
8. Use a semantic commit: `feat(db): <describe schema change>` or `refactor(db): <describe change>`
