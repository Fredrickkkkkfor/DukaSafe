# Supabase Connection Report

Last updated: 2026-07-01 final closure pass

## Connection

- Connected: Yes, using local `.env.local`.
- Project host detected: `istlyvpfwyazqmaarbyt.supabase.co`.
- Public anon key present: Yes.
- Service role key present locally: Yes, only in gitignored `.env.local`.
- Personal access token present locally: Yes, only in gitignored `.env.local` for management automation.

No secrets were printed or written to this report. The personal access token shared in chat must be rotated before production launch.

## Tables Checked

Checked with anon Supabase client using `select('*', { head: true, count: 'exact' })`.

| Table | Query result | Visible count |
|---|---:|---:|
| `profiles` | OK | 0 |
| `sellers` | OK | 0 |
| `seller_documents` | OK | 0 |
| `products` | OK | 0 |
| `orders` | OK | 0 |
| `order_status_events` | OK | 0 |
| `payments` | OK | 0 |
| `delivery_proofs` | OK | 0 |
| `disputes` | OK | 0 |
| `dispute_evidence` | OK | 0 |
| `reviews` | OK | 0 |
| `seller_reports` | OK | 0 |
| `admin_audit_logs` | OK | 0 |
| `policy_documents` | OK | 4 |

## Buckets Checked

Expected buckets:

- `seller-documents`
- `shop-photos`
- `product-images`
- `payment-proofs`
- `delivery-proofs`
- `dispute-evidence`

Anon storage list calls returned OK for all expected bucket names, with zero sampled objects.

Final closure update: `pnpm verify:rls` uploaded and removed real test objects in every expected bucket. Private payment proof public download was blocked, admin signed URL creation passed, and intended public shop photo access passed.

## RLS Status

- SQL file enables RLS on application tables and defines policies.
- Live RLS/storage smoke tests were run with buyer, seller, and admin identities.
- Two RLS gaps were found and fixed through `supabase_rls_hardening.sql`.
- `pnpm verify:rls` passed after the hardening SQL was applied.

## Schema Mismatches / Typing Gaps

- App has no generated Supabase TypeScript database types yet.
- App uses loose object typing in most data helpers and page maps.
- Admin document review needs signed URL support for private document previews.
- `admin_audit_logs.action` schema enum uses `request_more_info`; app was corrected during this audit to write that enum value.

## Required Follow-Up

1. Generate database types from the live project.
2. Add signed document previews to admin verification UI.
3. Complete browser-based E2E flows on staging.
4. Rotate the personal access token shared in chat before launch.

## Demo Mode Audit Result

During this audit, demo fallbacks were gated behind development-only missing-env mode. In production, missing Supabase env vars now throw a clear configuration error instead of silently using fake data.
