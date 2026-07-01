# Mobile QA Report

Last updated: 2026-07-01 staging browser QA pass

## Scope

Manual code/layout review plus local smoke routes. Full automated viewport screenshots were not completed in this pass.

Target widths requested:

- 320px
- 360px
- 390px
- 430px
- 768px
- 1024px
- Desktop

## Findings

- Most pages use responsive grids that collapse to one column.
- Buyer checkout, seller profile, order tracking, and dispute creation include sticky mobile CTAs where useful.
- Dashboard tables use `DataTable`, which has a mobile card rendering pattern.
- Admin pages are responsive but need more deliberate mobile drawer/card interactions for real evidence review.
- Forms generally use large controls and labels, but seller registration is long and should become true multi-step on mobile.
- No automated horizontal overflow scan has been run yet.
- Live route smoke passed for public seeded seller/product/order routes, but visual screenshot QA was not automated in this pass.
- Staging browser QA confirmed a 390px viewport could be applied and the landing page had no horizontal overflow.
- Extended viewport screenshot automation timed out before the full matrix completed.

## High-Priority Mobile Follow-Up

1. Run Playwright screenshots at every requested width for all core routes.
2. Fix any overflow in admin verification/dispute/order tables.
3. Add upload previews for seller documents, product images, payment proof, delivery proof, and dispute evidence.
4. Convert dispute type select into stacked mobile cards.
5. Add sticky submit/create buttons to long seller registration and create-link flows.

## Current Mobile Verdict

Responsive baseline is good, but mobile production QA is incomplete until automated viewport screenshots and interactive file-upload checks are run on the Netlify staging URL.

## Staging Screenshot Evidence

Desktop screenshots saved under `docs/staging-screenshots/`:

- `landing-desktop.png`
- `check-desktop.png`
- `seller-profile-desktop.png`
- `checkout-desktop.png`
- `login-desktop.png`
- `signup-desktop.png`

## Post-fix regression after upload/dispute validation fixes

Date: 2026-07-01

LAN URL for phone testing:

- `http://192.168.100.14:3000`

Mobile-relevant fixes verified at code/browser level:

- Server Action body limit is now `15mb`, leaving room for multipart overhead while the app validator remains capped at `8 MB`.
- Product upload failures now route to a friendly create-link page error.
- Dispute complaint minimum length is enforced in the UI and short submissions return a friendly page error.
- The buyer-owned dispute page now loads correctly instead of returning 404.
- Product images render on mobile-friendly seller profile cards because product cards now include the public image URL.
- Generated link actions use full URLs for copy/share after hydration.
- Buyer and seller admin-route attempts are blocked with the mobile-friendly unauthorized page.

Manual phone status:

- LAN server is reachable from the host at `http://192.168.100.14:3000`.
- Physical phone interaction was not directly observable from this automation session.
- User should still open the LAN URL on the phone and check login, seller dashboard, create protected link, checkout, dispute page, and admin verification page if signed in as admin.

Current post-fix mobile verdict:

Ready for controlled staging only. The specific upload/dispute regressions were fixed, but physical phone upload and viewport QA remain required before production launch.
