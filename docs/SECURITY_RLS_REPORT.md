# Security and RLS Report

Last updated: 2026-07-01 final closure pass

## Security Rules Checked In Code

- No Supabase secret is hardcoded in source code by app logic.
- `.env.local` is gitignored.
- Service role key is present only in gitignored `.env.local` for server-side/local verification scripts.
- Frontend uses only public Supabase URL/anon key.
- Admin pages perform server-side role checks through profile role.
- Several server actions now enforce explicit buyer/seller ownership and status checks instead of relying only on RLS.
- Demo mode is now development-only and visible.

## Live RLS Checks Completed

- Anon table count queries completed without errors and returned zero visible rows for private app data.
- `policy_documents` returned four published rows.
- Controlled buyer/seller/admin identities were created.
- `pnpm verify:rls` passed after live RLS hardening.
- Buyer can read own order.
- Seller can read own order.
- Public cannot read private order.
- Seller cannot self-mutate `verified` or `trust_score`.
- Suspended seller cannot create active product.
- Seller/buyer storage uploads passed for all expected buckets.
- Public private-proof read was blocked.
- Admin signed URL generation for private proof passed.

## RLS Checks Still Required

Still recommended with expanded fixtures:

- Buyer A cannot read Buyer B order.
- Seller A cannot read Seller B order.
- Non-admin cannot resolve dispute.
- Pending seller cannot create active product with a separate pending fixture.
- Full admin dispute review through UI.

## Known Risks

- Admin document preview is not implemented with signed URLs in the UI, though storage policy permits admin signed URL access.
- `reportSellerAction` requires an authenticated user, while product requirements imply public reporting may be needed.
- The personal access token pasted in chat must be rotated before launch.

## Secret Scan Plan

Before final handoff:

- Run ripgrep for Supabase/JWT/key/token patterns excluding `.env.local`, `.next`, `node_modules`, logs, and lock build artifacts.
- Confirm `.env.local` is not staged.
- Confirm no service role key or personal access token appears in browser bundle or source.

## Secret Scan Result

Completed on 2026-07-01 using ripgrep patterns for Supabase personal access tokens, service-role env assignments, access-token env assignments, and JWT-shaped values, excluding `.env*`, `.next`, `node_modules`, logs, lock files, and build info.

Result: no matches.

## Current Security Verdict

Substantially improved. Core live RLS/storage smoke tests now pass after hardening. Final launch still needs expanded cross-user fixtures and browser-based admin/buyer/seller flow verification.
