# Manual Flow Verification

Last updated: 2026-07-01

## Live Supabase Status

- Project connection works.
- Policy documents exist.
- Core transactional tables are empty.
- No local service role key is available.
- Phone OTP provider is not enabled; email fallback is required for local verification.

## Flow A: Buyer Checks Seller

Status: Partially verified by route smoke only.

- `/check` loads.
- Live seller result cannot be verified because `sellers` has zero visible rows.

## Flow B: Seller Onboarding

Status: Not completed live.

Blocked by need for test seller account and safe test upload files.

## Flow C: Admin Verifies Seller

Status: Not completed live.

Blocked by need for admin/operations profile and test pending seller.

## Flow D: Seller Creates Link

Status: Not completed live.

Blocked until seller is approved.

## Flow E: Buyer Places Order

Status: Not completed live.

Blocked until live product exists.

## Flow F: Seller Dispatches

Status: Not completed live.

Blocked until live order reaches paid status.

## Flow G: Buyer Confirms Delivery

Status: Not completed live.

Blocked until live dispatched order exists.

## Flow H: Dispute

Status: Not completed live.

Blocked until live buyer order exists.

## Required Next Manual Run

Create controlled QA data in Supabase and run every flow end-to-end. Record order codes, seller slug, and dispute code in a private QA note, not in committed docs if they include personal data.
