# Production Data Cleanup Report

Last updated: 2026-07-01

## Scope

This report covers cleanup readiness for controlled live Supabase test data created during production-readiness verification.

## Current Cleanup Tooling

Safe cleanup script exists:

```bash
pnpm cleanup:live-test-data
```

The script only targets:

- configured controlled test emails from local environment variables;
- seller records matching `test-dukasafe-seller`;
- seller records whose shop name matches `DukaSafe Test Seller`;
- dependent orders, payments, delivery proofs, disputes, dispute evidence, reviews, products, seller documents, and related audit rows attached to those known test seller/order records.

Auth user deletion is disabled unless `DUKASAFE_DELETE_TEST_AUTH_USERS=true` is explicitly set.

## Cleanup Status

- Cleanup was not run in this pass.
- Reason: final deployed staging and physical-phone QA still need controlled fixtures. Running cleanup now could remove the test data needed for the next verification step.

## Required Pre-Launch Cleanup

Before production launch, run the cleanup script after final staging QA and then manually inspect Supabase for:

- `E2E TEST`
- `DukaSafe Test`
- `test-dukasafe-seller`
- fake buyer/seller profiles
- fake phone numbers
- fake social handles
- test products
- test orders
- test disputes
- test reports

## Safe Cleanup Rules

- Do not delete unmarked records.
- Do not delete real seller applications.
- Do not delete production policy documents.
- Do not delete storage objects unless they are clearly under known test paths.
- Record cleanup date, operator, and affected test identifiers in the launch log.

## Verdict

Cleanup readiness is acceptable for controlled staging. Production launch remains blocked until cleanup is run after deployed QA is complete.
