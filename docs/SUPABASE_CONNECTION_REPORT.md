# Supabase Connection Report

Last updated: 2026-07-01

## Connection

- Connected: Yes, using local `.env.local`.
- Project host detected: `istlyvpfwyazqmaarbyt.supabase.co`.
- Public anon key present: Yes.
- Service role key present locally: No.
- Personal access token present in app runtime env: Not detected in `.env.local`.

No secrets were printed or written to this report.

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

Important: because no service role key is present locally and buckets are empty, this does not prove private file protection. It does show the bucket APIs are reachable. Private storage RLS must be verified with real uploaded objects and unauthenticated access attempts.

## RLS Status

- SQL file enables RLS on application tables and defines policies.
- Live policy presence was not introspected because local service role/database credentials are not available.
- Anon table count queries returning OK with zero visible rows is not sufficient proof of correct RLS.
- Private storage bucket list calls returning OK require follow-up verification with real files.

## Schema Mismatches / Typing Gaps

- App has no generated Supabase TypeScript database types yet.
- App uses loose object typing in most data helpers and page maps.
- Admin document review needs signed URL support for private document previews.
- `admin_audit_logs.action` schema enum uses `request_more_info`; app was corrected during this audit to write that enum value.

## Required Follow-Up

1. Add service role key only to server-side local/deployment env for admin verification scripts, or use Supabase CLI/database connection for policy introspection.
2. Generate database types from the live project.
3. Upload test private files and prove unauthenticated access fails.
4. Create buyer/seller/admin test identities and run RLS negative tests.

## Demo Mode Audit Result

During this audit, demo fallbacks were gated behind development-only missing-env mode. In production, missing Supabase env vars now throw a clear configuration error instead of silently using fake data.
