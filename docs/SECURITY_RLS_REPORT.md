# Security and RLS Report

Last updated: 2026-07-01

## Security Rules Checked In Code

- No Supabase secret is hardcoded in source code by app logic.
- `.env.local` is gitignored.
- Service role key is not present in local `.env.local`.
- Frontend uses only public Supabase URL/anon key.
- Admin pages perform server-side role checks through profile role.
- Several server actions now enforce explicit buyer/seller ownership and status checks instead of relying only on RLS.
- Demo mode is now development-only and visible.

## Live RLS Checks Completed

- Anon table count queries completed without errors and returned zero visible rows for private app data.
- `policy_documents` returned four published rows.
- Storage bucket list calls returned OK for all buckets with zero objects.

## RLS Checks Still Required

Using three real test identities:

- Buyer cannot read another buyer order.
- Buyer cannot read seller documents.
- Seller cannot read another seller orders.
- Seller cannot approve self or mutate `verified`, `trust_score`, `seller_status`, or admin fields.
- Public cannot read private evidence/document object URLs.
- Admin can review verification and disputes.
- Private storage objects require signed/authenticated access.
- Public product/shop images are readable only when intended.

## Known Risks

- Storage list calls returning OK for expected buckets must be verified with actual uploaded private files.
- Admin document preview is not implemented with signed URLs.
- No service role key locally means admin storage and policy introspection could not be fully audited.
- `reportSellerAction` requires an authenticated user, while product requirements imply public reporting may be needed.
- Live database has no test user records, so cross-identity RLS has not been proven.

## Secret Scan Plan

Before final handoff:

- Run ripgrep for Supabase/JWT/key/token patterns excluding `.env.local`, `.next`, `node_modules`, logs, and lock build artifacts.
- Confirm `.env.local` is not staged.
- Confirm no service role key or personal access token appears in browser bundle or source.

## Secret Scan Result

Completed on 2026-07-01 using ripgrep patterns for Supabase personal access tokens, service-role env assignments, access-token env assignments, and JWT-shaped values, excluding `.env*`, `.next`, `node_modules`, logs, lock files, and build info.

Result: no matches.

## Current Security Verdict

Improved, but RLS and private storage are not fully verified. Not launch-ready until cross-identity tests pass.
