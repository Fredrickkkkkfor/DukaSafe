# E2E Test Report

Last updated: 2026-07-01

## Automated Tests Present

- No dedicated unit test framework is configured.
- No Playwright E2E suite is configured.
- Current quality gates are `pnpm lint`, `pnpm typecheck`, and `pnpm build`.

## Minimum Tests Still Needed

Unit tests:

- `formatStatus`
- trust badge label/tone helper behavior
- check-seller input normalization
- buyer protection fee calculation
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

The live database is mostly empty. To run meaningful E2E:

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

Not complete. Smoke tests returning 200 are useful but do not prove production readiness.
