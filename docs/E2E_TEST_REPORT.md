# E2E Test Report

Last updated: 2026-07-01 final closure pass

## Automated Tests Present

- Vitest is configured.
- Unit tests exist in `tests/domain.test.ts`.
- No Playwright E2E suite is configured yet.
- Current quality gates are `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, and `pnpm verify:rls`.

## Minimum Tests Still Needed

Added unit tests:

- status label mapping
- trust badge label helper
- check-seller input normalization
- buyer protection fee calculation
- total calculation
- slug/list helpers

Still needed:

- zod validation schemas

Integration/server-action tests:

- create product guard for pending/suspended sellers
- create order guard for inactive products/sellers and missing proof
- create dispute ownership/window checks
- admin approval guard

Playwright E2E:

- landing loads
- check seller empty/not-found result
- seller profile missing and live seller profile
- seller registration
- seller create link after approval
- buyer checkout
- order tracking
- dispute creation
- admin route blocked unauthenticated
- admin route allowed with admin test identity

## Live Supabase Test Data Strategy

Live seed data now exists:

- seller slug: `test-dukasafe-seller`
- product checkout route: `/checkout/eaf5f0f8-543d-4007-9ac2-a8b7e8883483`
- order code: `DS-2607-9F432F`

To run full browser E2E:

1. Create buyer test account.
2. Create seller test account.
3. Assign one admin/operations profile manually in Supabase.
4. Submit seller verification with safe test documents.
5. Approve seller as admin.
6. Create product.
7. Place order with test M-PESA screenshot.
8. Dispatch and dispute/close the order.
9. Clean up test data or mark it clearly as QA data.

## Current E2E Verdict

Not complete. Live RLS/storage and route smoke tests are stronger now, but full browser E2E has not been automated.
