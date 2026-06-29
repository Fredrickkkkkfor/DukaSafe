# DukaSafe

DukaSafe is a verified checkout and buyer-seller protection platform for Kenyan social commerce. It uses Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, Supabase Postgres, Supabase Storage, server actions, and RLS-compatible data access.

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=
```

Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required by the browser. Keep service-role keys and personal access tokens server-side only.

3. Run locally:

```bash
pnpm dev
```

## Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Netlify Deployment

Build command:

```bash
pnpm build
```

Publish directory:

```bash
.next
```

Required Netlify environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Optional server-only variables:

```bash
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ACCESS_TOKEN
```

Do not expose service-role keys or personal access tokens to client-side code.

## Supabase Post-Deploy Checklist

- Add the Netlify production URL to Supabase Auth site URL.
- Add the Netlify production URL and deploy preview URLs to Supabase Auth redirect URLs.
- Confirm storage buckets exist: `seller-documents`, `shop-photos`, `product-images`, `payment-proofs`, `delivery-proofs`, `dispute-evidence`.
- Confirm RLS policies from `dukasafe_supabase_schema.sql` are enabled.
- Create an admin/operations user in Supabase Auth, then set `profiles.role` to `admin` or `operations`.
