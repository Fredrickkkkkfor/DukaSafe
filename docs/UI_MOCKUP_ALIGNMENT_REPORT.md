# UI Mockup Alignment Report

Last updated: 2026-07-01

| Page / Flow | Matching mockup | Current alignment | Remaining gaps |
|---|---|---|---|
| Landing | `01_landing-page_social-checkout-trust.png` | Warm ivory/sand/forest layout, trust cards, CTAs, metrics | Static metrics/testimonials need launch-ready content |
| Check Seller | `02_check-seller_search-trust-profile.png`, `02_check-seller_search-verification-wide.png` | Search-first layout with safety warning and seller result cards | Input normalization should be extracted/tested; live results empty |
| Public Seller Profile | `03_public-seller-profile_aisha-styles-trusted.png` | Trust card, metrics, product links, report concern, masked WhatsApp | Needs richer product media/review polish once live data exists |
| Buyer Checkout | `04_buyer-checkout_mpesa-payment-proof.png` | Product/seller summary, fee breakdown, M-PESA proof upload, sticky CTA | Needs preserve-form-after-auth and mobile upload preview |
| Order Tracking | `05_order-tracking_dispatched-evidence-timeline.png` | Timeline, status stepper, evidence table, role-aware actions | Payment proof replacement pending; richer evidence previews needed |
| Raise Dispute | `06_raise-dispute_buyer-evidence-form.png` | Order context, dispute type, evidence upload, sticky submit | Needs visual dispute type cards instead of select |
| Seller Registration | `07_seller-registration_verification-form.png` | Full verification form, uploads, terms, progress indicator | Not a true multi-step wizard; no upload previews/save progress |
| Seller Pending | `08_seller-verification-pending_review-timeline.png` | Status-aware pending/needs-info/rejected page | Could add clearer timeline dates |
| Seller Dashboard | `09_seller-dashboard_trust-score-orders.png` | Metrics, product links, reviews, verification state | Needs action-required grouping and better mobile dashboard density |
| Create Link | `10_create-order-link_live-checkout-preview.png` | Form + live preview + WhatsApp/share URL | Needs image preview and copy-to-clipboard client behavior |
| Admin Verification | `11_admin-verification-queue_document-review.png` | Queue, document metadata cards, checklist, actions | Needs signed document viewer and three-panel layout |
| Admin Dispute Review | `12_admin-dispute-review_evidence-resolution.png` | Evidence columns, timeline, notes, resolution form | Needs stronger confirmation modal and actual evidence file previews |
| Admin Orders | `13_admin-orders-transactions_table-dashboard.png` | Metrics, filters, table | Filters/export are mostly UI placeholders |
| Charter | `14_dispute-charter_buyer-seller-protection.png` | Buyer/seller cards and process timeline | Good baseline; should link more deeply from checkout/disputes |

## Summary

The app visually follows the mockups at a system level: premium cards, forest green, warm sand, amber highlights, mobile-first spacing, and trust-centered hierarchy. The main UI gaps are not color/style; they are production interaction details: upload previews, signed evidence viewers, confirmation modals, filter functionality, and true multi-step seller onboarding.
