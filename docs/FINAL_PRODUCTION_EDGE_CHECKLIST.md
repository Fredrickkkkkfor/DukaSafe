# Final Production Edge Checklist

Last updated: 2026-07-01

## 1. Deployment readiness

- Status: Blocked for production launch.
- Local/LAN validation has passed in prior closure passes.
- A real deployed staging URL was not provided in this pass, so Netlify/staging browser QA, deployed Auth redirects, deployed console checks, and deployed bundle/network inspection are not complete.
- Required before launch:
  - Deploy current `main` to Netlify staging.
  - Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Netlify.
  - Add the deployed URL to Supabase Auth Site URL and redirect allow list.
  - Verify the deployed app is not in demo mode.
  - Verify no secret values appear in browser network responses or bundles.

## 2. Auth readiness

- Status: Ready for controlled staging; deployed verification still required.
- Existing live Supabase test identities and role guards have been verified in prior local/LAN tests.
- Required before launch:
  - Buyer login/logout on deployed URL.
  - Seller login/logout on deployed URL.
  - Admin login/logout on deployed URL.
  - Session refresh and browser back-button cache tests on deployed URL.
  - Deployed role-aware redirects for buyer, seller, admin, and unauthenticated users.

## 3. Buyer flow readiness

- Status: Ready for controlled staging; not launch-cleared.
- Buyer UI has been improved for check seller, protected orders, checkout, tracking, disputes, and policy clarity.
- Required before launch:
  - Full deployed browser flow: check seller, seller profile, checkout, payment proof upload, tracking, delivery confirmation, dispute creation.
  - Physical phone proof upload from gallery/camera.
  - Cross-user private order access denial on deployed URL.

## 4. Seller flow readiness

- Status: Ready for controlled staging; not launch-cleared.
- Seller onboarding, dashboard, orders, product links, disputes, and role-aware navigation are implemented and PRD-aligned.
- Required before launch:
  - Deployed seller registration with ID/shop photo upload.
  - Pending seller cannot create links.
  - Approved seller can create links.
  - Seller can view own order evidence and upload dispatch proof.
  - Seller can respond to disputes if enabled for the case state.

## 5. Admin operations readiness

- Status: Ready for controlled staging with signed preview UI added in this pass.
- Admin navigation, verification queue, orders, disputes, reports, sellers, and policy pages are implemented.
- Signed preview links are now available on admin document/evidence review surfaces.
- Required before launch:
  - Admin approval/rejection/more-info through deployed UI with audit log confirmation.
  - Admin dispute resolution through deployed UI with audit log and timeline confirmation.
  - Evidence preview test for seller documents, payment proof, delivery proof, and dispute evidence on deployed URL.

## 6. Evidence/storage readiness

- Status: Strong for controlled staging.
- Prior live storage/RLS scripts verified uploads and private access controls.
- This pass adds server-side signed preview links for admin seller documents, payment proof, delivery proof, and dispute evidence review.
- Required before launch:
  - Confirm signed links open only for authorized admin/operations sessions.
  - Confirm public visitors cannot open private storage objects.
  - Confirm buyer/seller evidence visibility is limited to own orders/disputes.

## 7. Mobile readiness

- Status: Not production-cleared.
- Multiple mobile viewport passes have been documented from local/LAN testing.
- Required before launch:
  - Physical phone QA on the deployed staging URL.
  - Upload from phone camera/gallery for seller documents, shop photos, product images, payment proof, dispatch proof, and dispute evidence.
  - Screenshot evidence saved under `docs/staging-screenshots/physical-phone-qa/`.

## 8. Security/RLS readiness

- Status: Strong for controlled staging; expanded deployed attack tests still required.
- Prior `pnpm verify:rls` checks passed after hardening.
- Required before launch:
  - Buyer A cannot view Buyer B order on deployed URL.
  - Seller A cannot view Seller B order on deployed URL.
  - Seller cannot self-approve or change trust fields.
  - Non-admin cannot access or mutate admin actions.
  - Logout/back-button cache test does not expose admin content.

## 9. Monitoring readiness

- Status: Planned, not implemented.
- A monitoring and incident plan exists in `docs/MONITORING_AND_INCIDENT_PLAN.md`.
- Required before launch:
  - Enable error tracking.
  - Add uptime checks.
  - Define failed upload/auth alerting.
  - Confirm rollback process.

## 10. Data cleanup readiness

- Status: Cleanup script exists; production cleanup not run in this pass.
- `scripts/cleanup-live-test-data.ts` targets only known test emails and `test-dukasafe-seller`.
- Required before launch:
  - Run cleanup after final staging QA is complete.
  - Re-check Supabase for `E2E TEST`, `DukaSafe Test`, fake phones, fake products, fake disputes, and test reports.

## 11. Payment/legal/operations readiness

- Status: Not final launch-cleared.
- MVP positioning is manual M-PESA proof tracking, not fund custody.
- Operational SOP and payment/legal readiness docs now exist.
- Required before launch:
  - Approve public copy with legal/operations owner.
  - Define refund authority and process.
  - Do not use custody or fund-holding language unless approved.

## 12. Launch verdict

Verdict: Controlled staging only.

Reason: The app has passed local/LAN build, regression, RLS, storage, and UI hardening work, but production launch requires deployed Netlify staging QA, physical phone QA, real deployed browser E2E flows, final data cleanup, monitoring setup, and legal/operations approval.

Final command results from this pass:

- `pnpm install --frozen-lockfile`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `pnpm qa:postfix`: passed with a temporary local production server.
- `pnpm audit --prod`: passed.
- Redacted secret scan: passed.
