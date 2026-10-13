# MK Daily Restock Manager

Private, single-owner Sites app for Large MK 1/2 and Small MK 1/2. Uses the original blue-gray palette (#BCD0D7, #93A6AD, #6B7E84, #46575E, #23343A, #081315).

## Workflow
1. Add actual products under Products; choose Beverages, Snacks, or Fruit & pantry and assign stations.
2. In Station checks, mark each product Not checked, Full, Needs restock, or Out of stock.
3. Open Pick list to see pending refills consolidated by product, with destination stations.
4. Mark each destination Refilled or Unavailable. Add a note when helpful.
5. Storage watch retains unresolved shortages across days. Mark Storage replenished when stock returns. This clears the alert; complete today's refill separately.
6. History opens preserved workdays read-only. Export the selected workday as CSV.

Records persist in Cloudflare D1. Product archiving retains historical records. Each business day uses America/New_York (Atlanta), opens when first visited, and creates fresh checks from active assignments. New assignments are added when today's checklist is loaded; existing snapshots retain their original details, including archived products already checked that day. No quantities are required. Product library starts empty; no fictitious operational records are seeded.

## Private access
Sites owner-only access is required. Server page and APIs additionally require platform user identity. Mutation requests require matching Origin. Keep this Site private; this single-owner data model does not provide shared-workspace record isolation.

## Development
- Node 24+ and pnpm; install with the Sites install-dependencies helper.
- `npm run db:generate` after schema changes; commit generated SQL and metadata.
- `node node_modules/typescript/bin/tsc --noEmit`
- `node --test tests/api.test.mjs` (real SQLite with mocked platform identity and D1 interface)
- Use Sites build-site and source workflow helpers for build and publishing. Hosted migrations are applied by Sites. Do not run standalone Cloudflare deployments without configuring the Sites identity boundary.

The six integration tests cover auth/origin enforcement, snapshot uniqueness, shortage lifecycle, archiving/history retention, day separation, and validation. Browser QA was unavailable in this authoring environment.
