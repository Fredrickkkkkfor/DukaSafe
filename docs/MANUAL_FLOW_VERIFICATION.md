# Manual Flow Verification

Last updated: 2026-07-01 final closure pass

## Live Supabase Status

- Project connection works.
- Policy documents exist.
- Controlled buyer/seller/admin test identities exist.
- Live E2E seed data exists and is marked as test data.
- Phone OTP provider is not enabled; email fallback is required for local verification.

## Flow A: Buyer Checks Seller

Status: Partially verified with live seeded seller.

- `/check?q=test-dukasafe-seller` returned 200.
- `/s/test-dukasafe-seller` returned 200.

## Flow B: Seller Onboarding

Status: API/seed verified, browser form still manual.

- Seller test account exists.
- Seeded seller is approved for downstream checkout testing.
- Real `/seller/register` browser submission still needs a manual pass.

## Flow C: Admin Verifies Seller

Status: Auth/RLS verified, browser approval still manual.

- Admin test account exists.
- Admin signed private proof URL creation passed.
- `/admin/verification` unauthenticated response does not expose queue content.

## Flow D: Seller Creates Link

Status: Seed/product route verified.

- Approved test seller has active product route `/checkout/eaf5f0f8-543d-4007-9ac2-a8b7e8883483`.

## Flow E: Buyer Places Order

Status: Seed/order route verified, browser checkout still manual.

- Seeded order code `DS-2607-9F432F` exists with `payment_uploaded` status.

## Flow F: Seller Dispatches

Status: Not completed through browser.

Blocked until live order reaches paid status.

## Flow G: Buyer Confirms Delivery

Status: Not completed through browser.

Blocked until live dispatched order exists.

## Flow H: Dispute

Status: Not completed through browser.

Blocked until live buyer order exists and browser dispute flow is executed.

## Required Next Manual Run

Use the controlled identities and seeded routes to complete the browser flows on staging. Record any new private order/dispute IDs in a private QA note, not in committed docs if they contain personal data.
