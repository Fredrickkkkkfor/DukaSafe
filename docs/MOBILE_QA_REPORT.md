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

## Forensic UI / PRD alignment mobile notes

Date: 2026-07-01

Mobile-relevant fixes from the forensic pass:

- Role-aware header reduces buyer/seller/admin confusion on small screens.
- Seller bottom nav remains focused on dashboard, orders, create, and disputes.
- Seller order cards now contain evidence status and timeline preview directly in the card, reducing mobile context switching.
- Seller order table remains hidden behind mobile card rendering through `DataTable`.
- Create-link now uses a tappable upload surface with preview instead of a raw browser file input.
- Create-link form now uses placeholders instead of prefilled test content, reducing accidental test submissions on phone.
- Seller disputes empty state now explains response deadlines and evidence expectations.
- Complete-profile now explains why phone is required for seller onboarding and prevents casual role switching.

Still required on physical phone:

- Verify upload tap targets for product image, payment proof, delivery proof, seller documents, and dispute evidence.
- Verify seller create-link form has no horizontal overflow at 320px, 360px, 390px, and 430px.
- Verify seller order action cards do not become too tall or hide required CTAs.
- Verify admin verification/dispute pages are usable on tablet and phone.
- Save screenshots under `docs/staging-screenshots/forensic-ui-pass/` after a browser automation or manual capture pass.

Forensic screenshot files saved from the automation pass:

- `forensic-ui-pass/seller-orders-mobile-390.png`
- `forensic-ui-pass/seller-create-link-mobile-390.png`
- `forensic-ui-pass/seller-disputes-mobile-390.png`
- `forensic-ui-pass/complete-profile-mobile-390.png`
- `forensic-ui-pass/admin-disputes-mobile-390.png`
- `forensic-ui-pass/seller-orders-desktop.png`
- `forensic-ui-pass/seller-create-link-desktop.png`
- `forensic-ui-pass/seller-disputes-desktop.png`
- `forensic-ui-pass/complete-profile-desktop.png`

Note: the first automation pass captured some protected seller routes from an unauthenticated session before role login could be stabilized. Treat these as layout/error-state evidence, not final seller-workflow screenshots. A physical phone or stable deployed-browser pass should recapture the same filenames while signed in as seller/admin.

## Buyer interface forensic mobile notes

Date: 2026-07-01

Buyer mobile fixes completed:

- Buyer bottom nav now includes a Profile destination alongside Check, Orders, and Protect.
- `/check` safety warning card was changed from low-contrast glass styling to readable amber styling.
- `/check` example chips are tap targets that fill/search through query links.
- `/orders` now uses stacked evidence cards for buyer order state instead of relying only on a desktop-style table.
- Buyer order cards show payment proof, delivery proof, dispute status, seller trust, next step, and last update.
- `/checkout/[productId]` uses the tappable DukaSafe upload component for M-PESA proof.
- `/orders/[orderCode]/dispute` uses card-like dispute options and a tappable evidence upload control.
- `/seller/register` from the buyer upgrade path now uses FileUpload controls and placeholders instead of hardcoded demo values.
- `/protection-charter` now has practical examples and clear CTAs.

Buyer screenshot files saved:

- `buyer-ui-pass/check-mobile.png`
- `buyer-ui-pass/orders-mobile.png`
- `buyer-ui-pass/protection-mobile.png`
- `buyer-ui-pass/seller-register-mobile.png`
- `buyer-ui-pass/check-desktop.png`
- `buyer-ui-pass/orders-desktop.png`

Automated mobile checks:

- `/check` at 390px reported `scrollWidth <= innerWidth`, so no horizontal overflow was detected.
- No serious browser console errors were captured during the screenshot pass.

Still required on physical phone or deployed staging:

- Complete checkout with actual file picker upload.
- Submit dispute evidence with actual file picker upload.
- Confirm sticky CTAs do not cover form content during keyboard entry.
- Verify `/orders` while authenticated as a buyer with live orders.
- Verify public seller profile and checkout page on 320px and 360px physical widths.

Buyer mobile verdict:

Improved and suitable for controlled staging. Not production-launch ready until deployed staging and physical phone upload QA pass.

## Admin interface forensic mobile/tablet notes

Date: 2026-07-01

Admin mobile-relevant fixes completed:

- Admin mobile bottom nav now includes Verification, Orders, Cases, and Risk.
- `/admin/sellers` and `/admin/policy` were added so mobile admin navigation has real destinations.
- Existing `DataTable` mobile card rendering now applies to richer admin orders, disputes, reports, sellers, and policy rows.
- Admin verification application cards stack evidence signals, document metadata, and action forms on smaller screens.
- Admin orders now show evidence and action-needed state in card rows instead of relying only on wide status columns.
- Admin dispute detail panels are split into stackable buyer/seller/evidence/proof sections.
- High-impact admin action buttons now show pending state and require confirmation.

Still required on physical phone/tablet:

- Verify `/admin/verification` with at least one pending application.
- Verify `/admin/orders` filters and evidence cards at 320px, 390px, 768px, and 1024px.
- Verify `/admin/disputes/[disputeCode]` evidence panels do not become too cramped.
- Verify report status update forms are usable on phone.
- Verify seller suspension/verification confirmations are usable and not hidden by browser UI.
- Capture screenshots under `docs/staging-screenshots/admin-ui-pass/`.

Saved screenshot evidence from reviewed LAN captures:

- `admin-ui-pass/admin-verification-reviewed.png`
- `admin-ui-pass/admin-orders-reviewed.png`
- `admin-ui-pass/admin-disputes-reviewed.png`
- `admin-ui-pass/admin-reports-reviewed.png`

Admin mobile verdict:

Improved and suitable for controlled staging. Not production-launch ready until deployed staging and physical tablet/phone admin QA pass with real evidence records.

## Final physical phone QA requirement

Date: 2026-07-01

Physical phone QA was not completed in this pass because no deployed staging URL was available to test.

Folder reserved for future evidence:

- `docs/staging-screenshots/physical-phone-qa/`

Required phone checks before launch:

- Login/logout.
- Check seller.
- Public seller profile.
- Checkout with M-PESA proof upload from gallery/camera.
- Order tracking.
- Dispute evidence upload.
- Seller registration document/shop photo upload.
- Seller create product image upload.
- Seller dashboard and orders.
- Admin verification/dispute review on tablet or phone where practical.

Mobile verdict:

Controlled staging only. Prior responsive layout work is materially improved, but production launch requires physical phone QA on the deployed staging URL.
