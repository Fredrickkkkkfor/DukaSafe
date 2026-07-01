# Deployment Checklist

Last updated: 2026-07-01 final closure pass

## Required Environment Variables

Set in Netlify or deployment provider:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only if needed for future admin automation:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN`

Never expose server-only secrets to the browser. Rotate the personal access token pasted in chat before production deployment.

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
- Confirm `supabase_rls_hardening.sql` has been applied after any database reset.
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
pnpm test
pnpm verify:rls
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

Deployment config exists and live Auth/RLS/Storage smoke verification now passes. Deploy to controlled staging next; production launch should wait until the browser UI flows and mobile QA pass on the Netlify URL.

## Final Edge Closure Update

Date: 2026-07-01

Real deployed staging was not verified in this pass because no Netlify/staging URL was provided.

Required before launch:

- Deploy current `main` to Netlify staging.
- Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Netlify.
- Add the Netlify staging URL to Supabase Auth Site URL and redirect allow list.
- Confirm deployed login/logout and role-aware redirects.
- Confirm deployed app is not in demo mode.
- Inspect browser network/client bundle for accidental secret exposure.
- Run deployed buyer, seller, and admin E2E flows.
- Run physical phone QA against the deployed URL.

Deployment verdict remains: controlled staging only.
