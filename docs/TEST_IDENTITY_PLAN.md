# Test Identity Plan

Last updated: 2026-07-01

## Controlled Users

| Identity | Email | Role | Purpose |
|---|---|---|---|
| Buyer | `buyer.test@dukasafe.local` | `buyer` | Check seller, create order, upload payment proof, confirm delivery, raise dispute. |
| Seller | `seller.test@dukasafe.local` | `seller` | Submit verification, create product link, manage order, upload delivery proof, respond to dispute. |
| Admin | `admin.test@dukasafe.local` | `admin` | Approve seller, inspect orders, resolve disputes, verify admin-only access. |

Passwords are local-only `.env.local` values:

- `TEST_BUYER_PASSWORD`
- `TEST_SELLER_PASSWORD`
- `TEST_ADMIN_PASSWORD`

## Scripts

- `pnpm create:test-identities`: creates or updates Auth users and matching profiles. Requires `SUPABASE_SERVICE_ROLE_KEY`.
- `pnpm seed:live-test-data`: creates clearly marked live QA rows. Use `DUKASAFE_TEST_SELLER_APPROVED=true` and `DUKASAFE_SEED_TEST_ORDER=true` for checkout/order fixtures.
- `pnpm verify:rls`: signs in with the test identities and checks live RLS/storage behavior.
- `pnpm cleanup:live-test-data`: removes only records marked with `test-dukasafe-seller`, configured test emails, or linked E2E rows.

## Safety Rules

- Scripts refuse missing service-role credentials.
- Scripts do not print passwords, service role keys, anon keys, or access tokens.
- Cleanup does not target unmarked production records.
- Auth user deletion is opt-in through `DUKASAFE_DELETE_TEST_AUTH_USERS=true`.
