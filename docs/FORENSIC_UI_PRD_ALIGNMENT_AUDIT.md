# Forensic UI / PRD Alignment Audit

Last updated: 2026-07-01

## Screenshots reviewed

- `screencapture-192-168-100-14-3000-seller-orders-2026-07-01-13_27_07.png`
- `screencapture-192-168-100-14-3000-seller-orders-2026-07-01-13_28_01.png`
- `screencapture-192-168-100-14-3000-seller-create-link-2026-07-01-13_28_18.png`
- `screencapture-192-168-100-14-3000-seller-disputes-2026-07-01-13_28_47.png`
- `screencapture-192-168-100-14-3000-complete-profile-2026-07-01-13_29_40.png`

## Executive finding

The app is visually strong and connected to live Supabase, but several seller-facing screens still read like a polished prototype rather than a production trust workflow. The main gaps were role-confusing navigation, default/test form copy, thin empty states, vague seller actions, weak evidence visibility on order cards, and an ambiguous profile role selector.

This pass fixed the highest-impact PRD alignment issues without rebuilding the app or changing RLS/backend policy.

## Route audit matrix

Scores are 1-5. Evidence/trust score measures whether the page immediately communicates proof, status, actor, and next action. Mobile score measures layout readiness based on code review and prior browser checks; physical phone QA is still required.

| Route | User role | PRD purpose | Current UI state | Missing production behaviours | Evidence/trust | Mobile | Accessibility issues | Data/action issues | Required fixes | Status |
| --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- |
| `/` | Public | Explain DukaSafe value and route users | Strong landing baseline | Needs deployed conversion QA | 4 | 4 | No major issue found | None found | Keep copy evidence-forward | Not changed |
| `/check` | Public/buyer | Check seller before paying | Functional seller lookup | Needs broader mobile screenshots | 4 | 4 | No major issue found | Depends on seller data quality | Keep not-found warning neutral | Not changed |
| `/login` | Public/auth | Sign in and return to intended flow | Functional email fallback | Phone OTP depends on provider config | 3 | 4 | Native form labels present | Phone provider may be unavailable | Keep friendly phone fallback | Not changed |
| `/signup` | Public/auth | Create buyer or seller account | Functional | Needs full deployed auth retest | 3 | 4 | Labels present | Role write depends on profile trigger | Keep admin role unavailable | Not changed |
| `/complete-profile` | Auth | Finish safe user profile | Clean but unsafe-looking role selector | Existing users could think role can be casually changed; seller phone rationale missing | 3 -> 4 | 4 | Added helper text/error panel | Role now locked after onboarding; seller phone required | Lock roles, explain phone, friendly errors | Fixed |
| `/seller/register` | Seller | Verification submission | Strong form baseline | Still long; true multi-step mobile would improve | 4 | 3 | Labels present | Upload previews not yet added here | Future multi-step/upload preview | Not fixed |
| `/seller/pending` | Seller | Verification status | Clear pending timeline | Could link to My Verification wording | 4 | 4 | No major issue found | None found | Keep seller-specific wording | Not changed |
| `/seller/dashboard` | Seller | Seller business overview | Functional dashboard | Needs full mobile cards QA | 4 | 4 | No major issue found | None found | Continue evidence/action cards | Not changed |
| `/seller/orders` | Seller | Manage payment proof, dispatch proof, order evidence | Visually strong but vague actions and blank timeline cards | Payment proof details, evidence state, last update, proper closed-state action, clickable filters | 3 -> 5 | 3 -> 4 | Buttons/links remain semantic | Added payment/evidence/timeline detail; flag reason required | Evidence-forward order cards, filters, no "Monitor" | Fixed |
| `/seller/create-link` | Seller | Create protected checkout link | Good layout, but had production test defaults, native file input, low-contrast preview | Premium upload UI, readable preview, recent-link actions, placeholders instead of defaults | 3 -> 5 | 3 -> 4 | File input now accessible via label | Server action unchanged; friendly upload path already exists | FileUpload, preview, share actions, no defaults | Fixed |
| `/seller/disputes` | Seller | Respond to buyer disputes | Empty state was too thin | Response rules, status filters, evidence counts, richer cards | 2 -> 4 | 4 | No major issue found | Uses real disputes/evidence counts | Empty guidance and case cards | Fixed |
| `/seller/profile` | Seller | Seller profile management | No dedicated route present | Profile settings handled by `/complete-profile`; seller public profile by `/s/[slug]` | 3 | 4 | N/A | N/A | Consider dedicated seller profile editor later | Not present |
| `/seller/verification` | Seller | Seller verification status | Equivalent is `/seller/register` and `/seller/pending` | Label ambiguity fixed to "My Verification"; no dedicated route | 4 | 4 | N/A | N/A | Optional route alias later | Partially fixed |
| `/s/[sellerSlug]` | Public/buyer | Public seller trust profile | Strong profile; product images were missing in cards | Product image visibility on active links | 4 -> 5 | 4 | Image alt added via background not applicable | Product image URL now rendered | Show product images | Fixed |
| `/checkout/[productId]` | Buyer | Protected order creation | Functional checkout | Needs deployed file upload QA | 4 | 4 | Form labels present | Payment proof upload covered by prior storage tests | Retest on phone | Not changed |
| `/orders` | Buyer | Buyer order list | Functional | Needs role-aware nav consistency | 4 | 4 | No major issue found | None found | Header role-aware now applies | Fixed globally |
| `/orders/[orderCode]` | Buyer/seller/admin | Order timeline and actions | Evidence timeline is present | Needs screenshot QA after seller order improvements | 5 | 4 | No major issue found | Status actions connected | Keep evidence state clear | Not changed |
| `/orders/[orderCode]/dispute` | Buyer | Raise structured dispute | Recently fixed route/validation | Browser evidence upload still manual | 5 | 4 | Required/minLength fields present | Valid dispute created in live QA | Continue evidence upload QA | Previously fixed |
| `/admin/verification` | Admin | Review sellers | Functional queue | Rich signed previews still needed | 4 | 3 | Forms/buttons semantic | Admin guard verified; dynamic page | Add signed document preview later | Guard fixed previously |
| `/admin/orders` | Admin | Transaction monitoring | Functional table/cards | Needs more filters wired to query | 4 | 3 | No major issue found | Read-only filters mostly visual | Future filter actions | Not changed |
| `/admin/reports` | Admin | Seller safety reports | Functional | Needs detail workflow | 3 | 3 | No major issue found | Reports visible to admin only | Future report review workflow | Not changed |
| `/admin/disputes` | Admin | Dispute queue | Missing index route before this pass | Needed real nav destination and evidence summary | 0 -> 4 | 4 | DataTable mobile cards | Added live dispute queue | Create admin dispute queue | Fixed |
| `/admin/disputes/[disputeCode]` | Admin | Resolve dispute | Functional review page | Signed evidence previews still basic | 4 | 3 | Forms semantic | Admin guard verified | Future evidence preview drawer | Dynamic guard kept |
| `/protection-charter` | Public | Explain protection rules | Strong static/DB fallback | Needs deployed content QA | 4 | 4 | No major issue found | DB fallback documented | Keep linked globally | Not changed |
| `/dispute-charter` | Public | Explain dispute process | Strong static/DB fallback | Needs deployed content QA | 4 | 4 | No major issue found | DB fallback documented | Keep linked globally | Not changed |

## Fixes made in this pass

1. Role-aware header navigation:
   - Public visitors see public trust routes.
   - Buyers see check seller, orders, protection, profile, logout.
   - Sellers see dashboard, orders, create link, disputes, My Verification, profile, logout.
   - Admins see verification, orders, disputes, reports, sellers, logout.

2. Seller terminology:
   - Seller sidebar "Verification" renamed to "My Verification" to avoid confusion with admin verification.

3. Seller orders:
   - Added clickable status filters.
   - Added buyer phone, last update, payment/evidence state, expected/submitted amount, M-PESA code, proof uploaded time, and warning copy.
   - Replaced "Monitor" with "No action required" or "View timeline".
   - Replaced huge blank timeline boxes with evidence timeline previews.
   - Required a clear flag note when requesting review.

4. Create protected link:
   - Removed production default values like "White tulle set".
   - Replaced native file input with a DukaSafe upload surface with preview, hints, and size validation.
   - Reworked preview into a readable mini checkout card.
   - Added Open, Copy, WhatsApp, status, and date context to recent links.

5. Seller disputes:
   - Added status metrics/tabs, seller response rule, evidence count, required action, and richer empty state.

6. Complete profile:
   - Existing completed roles are locked from casual role switching.
   - Admin/operations remain impossible to select publicly.
   - Seller phone is required and explained as needed for M-PESA/order/dispute communication.
   - Friendly error panel added.

7. Admin disputes:
   - Added `/admin/disputes` queue so admin nav has a real dispute destination.

## Still needing work

- Physical mobile phone QA on the LAN URL.
- Netlify deployed staging QA.
- Browser file-picker automation for seller documents, product images, payment proof, delivery proof, and dispute evidence.
- Rich signed private previews for admin verification/dispute evidence.
- True multi-step mobile seller registration.
- Confirmation modal/loading state for seller payment confirmation. Server actions work, but the current form is still a simple server action submit.

## Verdict

Ready for controlled staging only.

The UI is more PRD-aligned and evidence-forward after this pass, but it is not production-launch ready until deployed staging, physical phone QA, and full browser upload flows pass.
