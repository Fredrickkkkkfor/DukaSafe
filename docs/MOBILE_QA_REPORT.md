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
