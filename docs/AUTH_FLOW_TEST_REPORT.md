# Auth Flow Test Report

Last updated: 2026-07-01

## Live Identity Setup

`pnpm create:test-identities` passed against live Supabase.

| Identity | Route/API Tested | Expected | Actual | Result |
|---|---|---|---|---|
| Buyer test user | Supabase Auth admin create/update | Confirmed buyer profile exists | Created/updated without printing password | Pass |
| Seller test user | Supabase Auth admin create/update | Confirmed seller profile exists | Created/updated without printing password | Pass |
| Admin test user | Supabase Auth admin create/update | Confirmed admin profile exists | Created/updated without printing password | Pass |
| Buyer | Anon client sign-in inside `pnpm verify:rls` | Session succeeds | Buyer read own order | Pass |
| Seller | Anon client sign-in inside `pnpm verify:rls` | Session succeeds | Seller read own order | Pass |
| Admin | Anon client sign-in inside `pnpm verify:rls` | Session succeeds | Admin created signed private proof URL | Pass |
| Public admin route | `/admin/verification` unauth smoke | Must not expose queue | Response contained `NEXT_REDIRECT` to login and no queue text | Pass |

## Still Manual

- Browser login/logout/session refresh needs a final human pass in the in-app browser and on a phone.
- Public signup through `/signup` should be tested with fresh staging emails before launch.
- Phone OTP remains blocked until a Supabase phone provider is configured.
