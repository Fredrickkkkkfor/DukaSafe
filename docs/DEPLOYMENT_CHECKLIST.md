# Deployment Checklist

Last updated: 2026-07-01

## Required Environment Variables

Set in Netlify or deployment provider:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only if needed for future admin automation:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN`

Never expose server-only secrets to the browser.

## Supabase Configuration

- Confirm SQL schema has been run.
- Confirm RLS policies are enabled.
- Confirm storage buckets exist:
  - `seller-documents`
  - `shop-photos`
  - `product-images`
  - `payment-proofs`
  - `delivery-proofs`
  - `dispute-evidence`
- Confirm storage policies protect private buckets.
- Add production URL to Supabase Auth Site URL.
- Add production and deploy preview URLs to Supabase Auth redirect allow list.
- Configure email auth.
- Configure SMS provider before enabling phone-first OTP in production.
- Create initial admin/operations account manually and set profile role.

## Build Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

Netlify:

- Build command: `pnpm build`
- Publish directory: `.next`

## Security Headers / Hardening

Added in `next.config.mjs`:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- restrictive baseline `Permissions-Policy`

Still recommended:

- Add a careful CSP after confirming Supabase/image endpoints.
- Add Sentry or equivalent production-safe error reporting.

## Post-Deploy Smoke Tests

1. Open landing page.
2. Open `/check`.
3. Open `/signup`.
4. Sign up buyer.
5. Sign up seller.
6. Submit seller verification.
7. Admin approves seller.
8. Seller creates product link.
9. Buyer places order.
10. Seller dispatches.
11. Buyer confirms or disputes.
12. Admin resolves dispute.

## Current Deployment Verdict

Deployment config exists, but production deployment should wait until live Auth/RLS/Storage flow verification is complete.
