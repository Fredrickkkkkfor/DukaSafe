# Final Production Closure Plan

Last updated: 2026-07-01

## 1. Already Done

- App builds, lints, typechecks, and connects to live Supabase.
- Demo data is development-only and missing-env-only.
- Production mode fails clearly when Supabase env vars are missing.
- Security headers and PWA manifest exist.
- Controlled live test identities were created with Supabase Auth admin APIs.
- Minimal live E2E seed data exists and is clearly marked as `E2E TEST` / `test-dukasafe-seller`.
- Live RLS/storage smoke tests were added and run.
- A live RLS weakness was found, patched with `supabase_rls_hardening.sql`, applied to Supabase, and retested successfully.

## 2. Still Unverified

- Full browser-based seller registration with real file uploads through the UI.
- Full browser-based admin approval workflow through `/admin/verification`.
- Full browser-based buyer checkout submission through `/checkout/[productId]`.
- Full browser-based seller dispatch, buyer delivery confirmation, review, and dispute resolution.
- Production deployment on Netlify with final domain/Auth redirect settings.
- Full visual QA with screenshots across every requested viewport.

## 3. Automatically Testable

- Domain helper behavior with `pnpm test`.
- Build gates with `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- Controlled Auth identity creation with `pnpm create:test-identities`.
- Live seed data creation with `pnpm seed:live-test-data`.
- Live RLS/storage attack checks with `pnpm verify:rls`.
- Test cleanup with `pnpm cleanup:live-test-data`.

## 4. Manual Test Identities

- Buyer: `buyer.test@dukasafe.local`
- Seller: `seller.test@dukasafe.local`
- Admin: `admin.test@dukasafe.local`

Passwords are stored only in gitignored `.env.local` and are not committed or printed.

## 5. Supabase Dashboard Configuration Needed

- Rotate the previously shared personal access token before launch.
- Confirm Auth Site URL and redirect allow-list for Netlify production and deploy previews.
- Confirm email auth is enabled.
- Configure SMS provider before enabling phone-first OTP.
- Keep `supabase_rls_hardening.sql` applied after any schema reset.
- Create the real production admin account and set its profile role to `admin` or `operations`.

## 6. Final Acceptance Criteria

Production-ready can only be claimed when:

- Live buyer/seller/admin Auth identities pass UI and API tests.
- Storage uploads pass for all private and public buckets.
- RLS attack tests pass.
- Buyer order, seller verification/link, seller dispatch, buyer delivery, dispute, and admin resolution flows pass through the browser UI.
- Mobile QA passes for all major routes.
- Build/lint/typecheck/tests pass.
- No secrets are committed or present in source.
- Demo mode cannot silently run in production.
