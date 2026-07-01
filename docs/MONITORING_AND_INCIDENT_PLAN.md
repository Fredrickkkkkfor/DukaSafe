# Monitoring and Incident Plan

Last updated: 2026-07-01

## Recommended Monitoring

- Error tracking: Sentry, Highlight, or equivalent for browser/server errors.
- Uptime monitoring: deployed homepage, `/check`, `/login`, and one protected-route redirect.
- Supabase monitoring: Auth errors, database errors, storage upload errors, RLS denial spikes.
- Admin action monitoring: approval, rejection, seller suspension, dispute resolution.
- Upload monitoring: seller documents, payment proofs, delivery proofs, dispute evidence.

## Production-Safe Logging

- Never log service role keys, access tokens, anon keys, passwords, OTPs, private file signed URLs, or raw ID document links.
- Log stable identifiers such as order code, dispute code, seller id, and action type.
- Redact phone numbers where possible in error logs.

## Alert Conditions

- Login failures spike.
- Storage uploads fail.
- Checkout order creation fails.
- Admin actions fail.
- Private signed URL generation fails.
- Unexpected 500s on buyer checkout, seller create link, admin verification, or dispute review.

## Incident Response Steps

1. Identify affected route and user role.
2. Check deployment logs and Supabase logs.
3. Check whether issue is auth, database, storage, RLS, or UI.
4. Disable risky public copy/action only if necessary; do not weaken RLS.
5. Communicate operational workaround to admin/support.
6. Patch in staging.
7. Run targeted regression.
8. Deploy fix.
9. Record incident, cause, resolution, and prevention.

## Rollback Plan

- Keep last known good commit/deployment available in Netlify.
- Roll back frontend deployment if UI/server action regression is severe.
- Do not roll back database hardening without a documented secure replacement.
- For bad data mutations, use targeted repair scripts rather than broad deletes.

## Launch Requirement

Production launch should wait until at least error tracking, uptime checks, and upload/auth failure monitoring are active or an explicit manual monitoring owner is assigned for limited beta.
