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
