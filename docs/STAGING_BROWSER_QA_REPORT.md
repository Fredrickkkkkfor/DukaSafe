# Staging Browser QA Report

Last updated: 2026-07-01

## 1. Staging URL Tested

No Netlify staging URL was present in repository metadata, README, `netlify.toml`, or local configuration.

Controlled staging target used for this pass:

- Local production server: `http://127.0.0.1:3002`
- Network equivalent: `http://192.168.100.14:3002`
- Commit tested: `4d3acb8`

This is production-mode `next start` against live Supabase env vars, not demo mode.

## 2. Browser / Device / Viewport Tested

- Browser: Codex in-app browser.
- Primary viewport: desktop browser viewport.
- Mobile viewport attempt: 390px viewport set succeeded for `/`; extended viewport automation timed out in the browser control layer.
- Screenshots saved under `docs/staging-screenshots/`.

## 3. Test Identities Used

No passwords are recorded here.

- Buyer: `buyer.test@dukasafe.local`
- Seller: `seller.test@dukasafe.local`
- Admin: `admin.test@dukasafe.local`

## 4. Environment Checks

| Check | Expected | Actual | Result |
|---|---|---|---|
| App loads in production mode | Server starts without runtime error | `next start` on port 3002 loaded | Pass |
| Live Supabase env | Real seller/product/order data visible | Test seller/product loaded | Pass |
| Demo mode hidden | No visible demo banner | No demo banner detected | Pass |
| Missing-env failure does not affect staging | Configured env loads | Routes load | Pass |
| Console errors | No serious app errors | No serious errors in route audit | Pass |

## 5. Route QA

| Route | Expected | Actual | Result |
|---|---|---|---|
| `/` | Landing loads | Loaded, no overflow, no demo banner | Pass |
| `/check?q=test-dukasafe-seller` | Seller search loads | Loaded, no overflow | Pass |
| `/login` | Login page loads | Loaded | Pass |
| `/signup` | Signup page loads | Loaded | Pass |
| `/seller/register` unauthenticated | Redirect to signup/login | Redirected to `/signup?next=/seller/register` | Pass |
| `/seller/pending` unauthenticated | Redirect to login | Redirected to `/login?next=/seller/pending` | Pass |
| `/seller/dashboard` as seller | Seller dashboard loads | Loaded after seller login | Pass |
| `/seller/create-link` as seller | Create link page available for approved seller | Page route available after seller login | Partial |
| `/s/test-dukasafe-seller` | Public seller profile loads | Loaded | Pass |
| `/checkout/eaf5f0f8-543d-4007-9ac2-a8b7e8883483` | Public checkout loads | Loaded | Pass |
| `/orders/DS-2607-9F432F` unauthenticated | Private order protected | Safe not-found/private state shown | Pass |
| `/orders/DS-2607-9F432F/dispute` unauthenticated | Redirect to login | Redirected to login | Pass |
| `/admin/verification` unauthenticated | Redirect to login | Redirected to login | Pass |
| `/admin/orders` unauthenticated | Redirect to login | Redirected to login | Pass |
| `/admin/disputes/DSP-STAGING-QA` unauthenticated | Redirect to login | Redirected to login | Pass |
| `/protection-charter` | Charter loads | Loaded | Pass |
| `/dispute-charter` | Charter loads | Loaded | Pass |

## 6. Auth QA

| Flow | Expected | Actual | Result |
|---|---|---|---|
| Buyer login | Buyer reaches orders | Buyer reached `/orders` and saw seeded order | Pass |
| Buyer refresh | Session persists | Buyer order page remained usable during session check | Pass |
| Buyer admin access | Admin content blocked | Admin queue not exposed; redirected away | Pass with UX note |
| Seller login | Seller reaches dashboard | Seller reached `/seller/dashboard` and saw metrics/order | Pass |
| Seller admin access | Admin content blocked | Admin queue not exposed; redirected to login | Pass with UX note |
| Admin credentials | Admin Auth succeeds | Direct Supabase Auth verification passed; role is `admin` | Pass |
| Admin browser login | Admin reaches admin dashboard through UI | Browser automation could not complete this submit reliably | Blocked |
| Logout | Session clears | Logout route returned user to public/login state during checks | Partial |

UX note: non-admin protected route attempts redirected to login rather than a visible unauthorized page in the browser session. Admin content was not exposed.

## 7. Seller Registration UI QA

Status: Not fully completed.

- Unauthenticated `/seller/register` correctly redirects to signup.
- Seller test identity is already approved, so the full pending-registration browser path requires a fresh seller identity.
- File upload and validation were not completed through browser UI in this pass.

Result: Blocked by need for a fresh seller UI test identity and stable browser upload automation.

## 8. Admin Approval UI QA

Status: Not fully completed.

- Admin credentials and profile role are valid.
- Admin signed private proof URL access passed in previous live storage test.
- Browser automation did not reliably complete admin login through the login page in this pass.
- Admin document UI still shows metadata cards, not rich signed previews.

Result: Blocked for full approval UI.

## 9. Product Link / Checkout / Lifecycle / Dispute UI QA

Status: Partial.

- Approved seller dashboard route works.
- Public checkout URL works.
- Private order route is protected from unauthenticated access.
- Full browser create-link, checkout form submit, delivery proof upload, buyer confirmation, review, dispute, seller response, and admin resolution were not completed.

Result: Ready for continued controlled staging, not production launch.

## 10. Screenshots

Saved files:

- `landing-desktop.png`
- `check-desktop.png`
- `seller-profile-desktop.png`
- `checkout-desktop.png`
- `login-desktop.png`
- `signup-desktop.png`

Mobile screenshot capture was attempted but timed out in browser control before files were saved.

## 11. Bugs Found

1. No real Netlify staging URL was available to test.
2. Browser automation could not reliably complete admin UI login, despite direct Supabase Auth confirming admin credentials.
3. Full seller registration/product/checkout/dispute UI flows remain unverified through the browser.
4. Admin verification page lacks rich signed document preview UI.
5. Mobile screenshot automation was incomplete.

## 12. Fixes Made

- No backend or application logic changes were made during this pass.
- Added staging QA reports and screenshot evidence.
- Added staging server logs to `.gitignore`.

## 13. Remaining Blockers

- Deploy to Netlify and provide/test the actual staging URL.
- Complete full browser UI flow QA on Netlify.
- Use a fresh seller identity for seller registration pending/approval tests.
- Verify admin login and admin approval through the deployed browser UI.
- Complete mobile screenshots and upload tests.

## 14. Final Staging Verdict

Ready for controlled staging only.

The app is not ready for production launch until the real deployed staging URL passes full buyer/seller/admin browser flows and mobile QA.

## 15. Post-fix regression after upload/dispute validation fixes

Date: 2026-07-01

Test target:

- Local staging/dev browser target: `http://127.0.0.1:3000`
- LAN target available for phone/manual check: `http://192.168.100.14:3000`
- Controlled identities used: buyer, seller, and admin test accounts from local env; passwords were not printed.

What was tested:

- Product image upload regression against live Supabase `product-images` storage.
- Protected link product row creation/update with a live uploaded image.
- Public seller profile rendering of the product image.
- Public checkout route for the generated product.
- Admin UI login redirect to `/admin/verification`.
- Admin access to `/admin/verification`, `/admin/orders`, `/admin/reports`, and `/admin/disputes/DSP-2607-1C68C6`.
- Buyer and seller admin-route blocking.
- Dispute route rendering for buyer-owned order `DS-2607-9F432F`.
- Empty and short dispute complaint validation.
- Valid dispute creation and order timeline update.
- Browser console checks on the touched routes.

Passes:

- Under-1 MB, 3 MB, and near-8 MB product image uploads succeeded in live storage.
- Above-8 MB product upload is blocked by the app validator and now redirects through a friendly create-link error path instead of surfacing a raw Next.js body-limit crash.
- Next Server Action body limit was raised to `15mb`; app-level upload limit remains `8 MB`.
- E2E post-fix product `a565e6c3-3c16-4abc-a6ba-bf3073c013c4` was created/updated in Supabase.
- Seller profile and checkout route both returned 200 and rendered the generated product.
- Product image is now displayed on the public seller profile.
- Create-link generated state renders Copy, Open, and WhatsApp actions.
- Admin browser login redirected to `/admin/verification`.
- Admin routes loaded with no captured console errors.
- Buyer and seller admin attempts now land on `/unauthorized`.
- The nested dispute page now loads for the buyer-owned order instead of returning 404.
- Empty dispute fields stay in browser validation.
- Short dispute complaint redirects back with a friendly page error; no raw `ZodError` appears.
- A valid dispute submission created dispute `DSP-2607-1C68C6`, changed order `DS-2607-9F432F` to `disputed`, and added a timeline event.

Fixes made:

- Raised Server Action body limit from `10mb` to `15mb`.
- Added friendly product validation/upload error redirects in `createProductAction`.
- Added real generated-link copy/share controls.
- Fixed WhatsApp/copy link generation to use the browser origin after hydration.
- Rendered product images on public seller profile product cards.
- Scoped the dispute page order lookup by authenticated `buyer_id`.
- Opted current-user lookup out of cross-request caching and forced admin pages dynamic.

Still not fully completed:

- File-picker automation for browser evidence uploads is not supported by the current in-app browser API, so dispute evidence upload remains covered by prior live storage/RLS checks plus manual phone QA.
- Physical phone QA on the LAN URL still needs the user to confirm from an actual device.
- Netlify deployed staging URL is still not available in repo/config.

Post-fix verdict:

Ready for controlled staging only. The runtime regressions found in upload/dispute/admin route checks were fixed, but production launch still needs deployed Netlify browser QA and physical phone upload checks.
