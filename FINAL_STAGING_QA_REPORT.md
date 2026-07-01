# Final Staging QA Report

Last updated: 2026-07-01

## Verdict

Ready for controlled staging only.

Do not launch production yet. The local production-mode staging target works for public routes, buyer login, seller login, live Supabase data, and protected route behavior, but the actual Netlify staging URL and full browser form journeys were not completed.

## 1. Staging URL

- Tested target: `http://127.0.0.1:3002`
- Network equivalent: `http://192.168.100.14:3002`
- Actual Netlify staging URL: not found in repo/config during this pass.

## 2. Commit Tested

`4d3acb8 Complete production closure verification`

## 3. Auth Result

- Buyer UI login: pass.
- Seller UI login: pass.
- Admin direct Auth/profile verification: pass.
- Admin browser UI login: blocked by browser automation instability; needs retest on deployed staging.
- Unauthenticated admin routes: protected.
- Non-admin admin access: admin content not exposed.

## 4. Seller Registration Result

Partial. Redirect behavior works, but full form submission with uploads requires a fresh seller account and was not completed.

## 5. Admin Approval Result

Blocked. Admin credentials are valid, but approval UI was not completed through the browser. Signed private storage access is proven at API level.

## 6. Product Link Result

Partial. Approved seller dashboard and existing product checkout route load. New product creation through browser UI was not completed.

## 7. Buyer Checkout Result

Partial. Public checkout route loads. New order creation through browser UI was not completed.

## 8. Order Lifecycle Result

Partial. Seeded buyer order appears after buyer login. Seller sees the seeded order. Dispatch/delivery/review lifecycle was not completed through browser UI.

## 9. Dispute Result

Blocked. Dispute creation/resolution was not completed through browser UI.

## 10. Storage Result

Previously passed with live `pnpm verify:rls` storage checks. Browser file-upload flows still need staging UI verification.

## 11. RLS / Security Result

Previously passed with live RLS/storage smoke checks after `supabase_rls_hardening.sql`. No secrets were printed or committed in this pass.

## 12. Mobile QA Result

Incomplete. Desktop screenshots were captured. A 390px viewport check for landing showed no overflow, but the extended viewport matrix timed out in browser automation.

## 13. Browser Console Result

No serious app console errors were found during route audit. Production server logs showed no runtime errors.

## 14. Bugs Fixed

No app logic bugs were fixed because the pass did not produce a confirmed code-level defect. Documentation and ignored staging logs were added.

## 15. Bugs Remaining

- Real Netlify staging URL unavailable.
- Admin browser login needs deployed retest.
- Full seller registration, admin approval, product creation, checkout, lifecycle, dispute, and mobile upload flows remain unverified.
- Admin document previews should be upgraded from metadata cards to signed private previews.

## 16. Final Verdict

Ready for controlled staging only.

Exact next step: deploy the pushed `main` branch to Netlify, configure Supabase Auth redirect URLs for that Netlify URL, then rerun this browser QA on the actual deployed staging URL.

## 17. Post-fix regression after upload/dispute validation fixes

Date: 2026-07-01

Commit under regression at start: `2cac30e Fix upload and dispute validation errors`

Additional fixes made in this pass:

- Raised Next Server Action body limit to `15mb` while keeping the app upload validator at `8 MB`.
- Added friendly create-link redirects for product validation/upload errors.
- Added real generated-link Copy/Open/WhatsApp controls.
- Fixed generated share URLs to use the browser origin after hydration.
- Rendered product images on public seller profile product cards.
- Fixed buyer dispute route 404 by scoping order lookup to authenticated `buyer_id`.
- Forced current-user lookup/admin pages out of cross-request caching so admin route guards do not leak cached content.

Regression results:

- Product image uploads under 1 MB, around 3 MB, and near 8 MB passed against live Supabase storage.
- Above-8 MB upload path is blocked by app validation and handled as a friendly create-link error.
- Protected link product `a565e6c3-3c16-4abc-a6ba-bf3073c013c4` exists in Supabase and opens at `/checkout/a565e6c3-3c16-4abc-a6ba-bf3073c013c4`.
- Seller profile shows the generated product and uploaded image.
- Admin login through browser reaches `/admin/verification`.
- Admin can access verification, orders, reports, and dispute review.
- Buyer and seller accounts are blocked from admin pages.
- Dispute empty/short complaint validation no longer crashes with raw Zod errors.
- Valid dispute submission created `DSP-2607-1C68C6`, moved order `DS-2607-9F432F` to `disputed`, and added a timeline event.
- Serious browser console errors were not captured on the post-fix routes after the fixes.

Remaining limitations:

- Browser file-picker automation could not attach dispute evidence through the in-app browser; live storage/RLS evidence bucket checks remain the coverage for private evidence uploads.
- Physical phone QA on `http://192.168.100.14:3000` still needs manual confirmation.
- Actual Netlify staging URL is still not tested.

Updated verdict:

Ready for controlled staging only. The upload/dispute/admin route regressions are fixed, but production launch still requires deployed Netlify QA and physical mobile upload verification.

## 18. Forensic UI / PRD alignment pass

Date: 2026-07-01

Audit created:

- `docs/FORENSIC_UI_PRD_ALIGNMENT_AUDIT.md`

What was wrong:

- Seller screens mixed buyer/public top navigation with seller sidebar navigation.
- Seller "Verification" label was ambiguous with admin verification.
- Seller orders were not evidence-forward enough for payment confirmation and dispatch decisions.
- Closed orders still implied monitoring instead of completion.
- Create-link looked like a demo form because default values/test-like content were prefilled.
- Create-link used a raw file input and low-contrast preview card.
- Seller disputes empty state did not explain what evidence and deadlines would appear.
- Complete-profile made role selection look too easy after profile completion.

What was improved:

- Role-aware navigation for public, buyer, seller, and admin contexts.
- Seller nav now says "My Verification".
- Seller orders now show proof review details, evidence state, buyer phone, last update, timeline preview, and clearer required action.
- Seller order metrics are clickable filters.
- Create-link now uses placeholders, a premium upload component, readable protected checkout preview, and recent-link actions.
- Seller disputes now show status buckets, response guidance, evidence count, and stronger empty state.
- Complete-profile now locks completed roles, blocks public admin role selection, and requires/explains phone for seller onboarding.
- Added `/admin/disputes` queue.

Current verdict:

Ready for controlled staging only.

This pass improves production polish and PRD alignment, but the app is still not production-launch ready until deployed Netlify QA, physical mobile QA, and full browser upload evidence flows pass.
