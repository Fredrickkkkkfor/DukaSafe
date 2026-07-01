# Admin UI Forensic Audit

Last updated: 2026-07-01

Screenshots reviewed:

- `/admin/verification`
- `/admin/orders`
- `/admin/disputes`
- `/admin/reports`
- `/protection-charter` while logged in as admin

Saved screenshot evidence:

- `docs/staging-screenshots/admin-ui-pass/admin-verification-reviewed.png`
- `docs/staging-screenshots/admin-ui-pass/admin-orders-reviewed.png`
- `docs/staging-screenshots/admin-ui-pass/admin-disputes-reviewed.png`
- `docs/staging-screenshots/admin-ui-pass/admin-reports-reviewed.png`

Scores are 1-5.

| Route | PRD purpose | Current UI state | Evidence visibility | Decision/action clarity | Security/RLS sensitivity | Mobile/tablet readiness | Missing production behaviours | Data/action issues | Required fixes | Status |
| --- | --- | --- | ---: | ---: | --- | ---: | --- | --- | --- | --- |
| `/admin/verification` | Review seller identity, shop proof, social ownership, and payment details | Clean but previously empty/passive | 2 -> 4 | 2 -> 4 | High: seller docs and admin decisions | 3 -> 4 | Recent review context, clearer metrics, evidence signals | Empty queue did not show recently reviewed sellers | Better metrics, richer applicant cards, protected-doc metadata, recent review table, confirmation actions | Fixed |
| `/admin/orders` | Monitor orders, payments, delivery proof, disputes, and risk | Strong visual shell but table-basic | 3 -> 5 | 3 -> 5 | High: buyer/order/evidence data | 4 | Evidence state, risk/action specificity, real filters | Filters were visual only | Real query filters, proof status, delivery proof, timeline count, seller trust, clearer row actions | Fixed |
| `/admin/disputes` | Queue dispute cases for neutral review | Good baseline but evidence/risk too thin | 3 -> 5 | 3 -> 5 | High: dispute/evidence data | 4 | Risk flags, better evidence count, seller response state | `0 files` was confusing for text-only cases | Text-only evidence state, payment/delivery proof indicators, repeat/high-value/no-response risk flags | Fixed |
| `/admin/disputes/[disputeCode]` | Resolve disputes neutrally using both sides' evidence | Functional but not enough side-by-side evidence | 3 -> 5 | 3 -> 5 | High: private evidence, order data, seller sanctions | 3 -> 4 | Buyer/seller panels, payment proof, delivery proof, timeline, confirmation actions | Seller evidence panel was empty by design and not explained | Balanced panels, proof panels, merged timeline, order snapshot, confirmation actions | Fixed |
| `/admin/reports` | Review seller safety reports privately | Clean but too thin | 2 -> 4 | 2 -> 4 | High: private reporter/seller risk data | 4 | Report status workflow, notes, risk language | No action path beyond viewing rows | Status update action, admin notes, audit log, private-signal warning | Fixed |
| `/admin/sellers` | Seller register/risk cockpit | Missing while nav pointed to sellers | 0 -> 4 | 0 -> 4 | High: seller status and suspension | 4 | Seller search/filter, trust/risk/status overview | Route missing | Created route with seller register, filters, risk badges, view/suspend actions | Fixed |
| `/admin/policy` | Admin policy document view | Missing while sidebar had Policy | 0 -> 4 | 0 -> 4 | Medium/high: policy docs editable by admin RLS | 4 | Policy document list, public charter routing | Route missing | Created route listing policy docs and audit entries | Fixed |
| `/protection-charter` as admin | View public policy from admin context | Strong public charter | 4 -> 5 | 4 -> 5 | Low public page; admin nav context | 4 | Contact/support CTA | Admin policy nav was ambiguous | Added support CTA and separate `/admin/policy` route | Fixed |
| Admin navigation/sidebar | Role-specific operations IA | Cleaner but Policy/Sellers reused routes | 3 -> 5 | 3 -> 5 | High: no route leakage | 4 | Real destinations and clearer dashboard label | Sellers/Policy not real admin routes | Added `/admin`, `/admin/sellers`, `/admin/policy`; renamed top CTA to Admin Dashboard | Fixed |

## Issues Found

- Admin top/sidebar navigation had Sellers and Policy labels that did not map to dedicated admin routes.
- The top “Operations” CTA was ambiguous as a dashboard entry point.
- Verification queue empty state was passive and “Rejected here - Manual” was confusing.
- Seller verification lacked a recent review/history area.
- Seller application cards did not immediately show social, payment, delivery, document, and policy signals.
- Admin orders showed status but not payment proof, delivery proof, timeline, or risk/action state.
- Admin order filters were visual only.
- Dispute queue displayed `0 files` even when a case may be a text-only complaint.
- Dispute queue did not surface missing seller response, missing delivery proof, high value, repeat seller, or payment-proof risk.
- Dispute detail page did not equally frame buyer and seller positions.
- Reports page did not provide a report status workflow or admin note action.

## Fixes Made

- Added `/admin` redirect to `/admin/orders`.
- Added `/admin/sellers`.
- Added `/admin/policy`.
- Updated admin navigation to include Verification, Orders, Disputes, Reports, Sellers, and Policy.
- Renamed the header CTA to `Admin Dashboard`.
- Added reusable `ConfirmSubmitButton` for admin actions with confirmation and pending state.
- Expanded admin data reads for sellers, audit logs, richer orders, richer disputes, and policy documents.
- Reworked verification queue metrics and applicant cards around evidence and risk signals.
- Added recent reviewed sellers table for audit context.
- Reworked admin orders into a filterable evidence register.
- Reworked dispute queue evidence/risk columns.
- Reworked dispute detail into balanced buyer/seller evidence, payment proof, delivery proof, and timeline panels.
- Added report status update action with admin notes and audit log entry.
- Added Contact Support CTA to the protection charter.

## Security Notes

- Existing server-side role guards remain on every `/admin/*` page.
- New admin routes use the same `admin`/`operations` profile role check.
- No RLS weakening was performed.
- Private evidence and document rows are shown as protected metadata. Public raw private URLs are not introduced by this pass.
- Seller suspension and dispute/report decisions still write audit logs through server actions.

## Remaining Blockers

- Deployed Netlify staging URL has not been tested.
- Physical phone/tablet admin QA is still required.
- Signed private preview thumbnails for ID documents, payment proof, delivery proof, and dispute evidence should be added before launch.
- Admin approval, report update, seller suspension, and dispute resolution need final browser-click QA on deployed staging.
- Report status action is implemented, but richer report detail drawers/pages are still a later hardening item.

## Verdict

Ready for controlled staging only.

The admin UI is now substantially more evidence-forward and operations-grade, but production launch still requires deployed staging QA, physical mobile/tablet QA, secure signed evidence previews, and browser-verified admin seller approval/dispute resolution flows.
