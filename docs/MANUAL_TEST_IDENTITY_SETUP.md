# Manual Test Identity Setup

Last updated: 2026-07-01

Automated identity creation succeeded in this environment. Keep these manual steps for future operators without a service role key.

1. Open Supabase Dashboard.
2. Go to Authentication > Users.
3. Create:
   - `buyer.test@dukasafe.local`
   - `seller.test@dukasafe.local`
   - `admin.test@dukasafe.local`
4. Set or confirm strong passwords outside git.
5. Mark each email as confirmed, or disable email confirmation only in a disposable staging project.
6. Open Table Editor > `profiles`.
7. Confirm profile rows exist with matching user IDs.
8. Set roles:
   - buyer profile: `buyer`
   - seller profile: `seller`
   - admin profile: `admin` or `operations`
9. Keep all three `is_active = true`.
10. Re-run `pnpm verify:rls` after seed data exists.
