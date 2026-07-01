# DukaSafe Route Coverage Matrix

Legend: Complete = implemented and connected in code; Partial = implemented but has gaps or limited verification; Untested = not verified against live data; N/A = not applicable.

| Route | User type | Purpose | UI status | DB read status | DB write status | Storage status | Auth requirement | Mobile status | Production readiness |
|---|---|---|---|---|---|---|---|---|---|
| `/` | Public | Landing page | Complete | N/A | N/A | N/A | Public | Responsive | Partial: static metrics/testimonials need production content review |
| `/check` | Public/buyer | Check seller trust | Complete | Connected to `sellers` | N/A | N/A | Public | Responsive | Partial: live DB empty; input normalization is basic |
| `/s/[sellerSlug]` | Public/buyer | Public seller profile | Complete | Connected to `sellers`, `products`, `reviews` | Report form writes via action | N/A | Public | Responsive with sticky CTA | Partial: live seller data untested |
| `/checkout/[productId]` | Buyer | Protected checkout | Complete | Connected to `products`, `sellers` | Writes `orders`, `payments`, `order_status_events` | Uploads payment proof | Auth required before order creation | Responsive with sticky CTA | Partial: live upload/order flow untested |
| `/order/new/[productId]` | Buyer | Checkout alias | Complete | Same as checkout | Same as checkout | Same as checkout | Same as checkout | Same as checkout | Partial |
| `/orders` | Buyer | Buyer order list | Complete | Connected to `orders` | N/A | N/A | Authenticated buyer | Responsive cards/table | Partial: live buyer data untested |
| `/orders/[orderCode]` | Buyer/seller/admin | Order tracking | Complete | Connected to order evidence tables | Status actions write orders/events | Delivery proof via actions | Auth role-sensitive actions | Responsive with sticky CTA | Partial: live lifecycle untested |
| `/orders/[orderCode]/dispute` | Buyer | Raise dispute | Complete | Connected to order | Writes `disputes`, `dispute_evidence`, `orders`, events | Uploads dispute evidence | Buyer owns order | Responsive with sticky CTA | Partial: live evidence upload untested |
| `/seller/register` | Seller | Seller verification application | Partial | Reads existing seller/profile | Writes `profiles`, `sellers`, `seller_documents` | Uploads ID/shop photos | Authenticated seller | Mobile single-column responsive | Partial: not true multi-step, no upload previews |
| `/seller/pending` | Seller | Verification status | Complete | Reads seller state | N/A | N/A | Authenticated seller | Responsive | Partial: live status untested |
| `/seller/dashboard` | Seller | Seller dashboard | Complete | Reads seller/products/orders/reviews/disputes | N/A | N/A | Authenticated seller | Responsive | Partial: live data empty |
| `/seller/create-link` | Seller | Product checkout link creation | Complete | Reads seller/products | Writes `products` | Uploads product image | Approved active seller | Responsive | Partial: live upload untested |
| `/seller/orders` | Seller | Order management | Complete | Reads seller orders/evidence | Confirms payment, flags proof, dispatches | Uploads delivery proof | Authenticated seller | Responsive cards | Partial: live lifecycle untested |
| `/seller/disputes` | Seller | Seller dispute list | Complete | Reads disputes | N/A | N/A | Authenticated seller | Responsive | Partial: live disputes untested |
| `/seller/disputes/[disputeCode]` | Seller | Seller dispute response | Complete | Reads dispute/evidence | Writes seller response/evidence/events | Uploads counter-evidence | Authenticated seller | Responsive | Partial: ownership guard needs further hardening |
| `/admin/verification` | Admin/operations | Seller verification queue | Partial | Reads sellers/documents | Approve/reject/request info | Needs signed private previews | Admin/operations | Responsive, not full three-panel | Partial: document viewing incomplete |
| `/admin/orders` | Admin/operations | Orders and transactions | Partial | Reads orders/payments/proofs/disputes | N/A/export placeholder | N/A | Admin/operations | Responsive table/cards | Partial: filters not fully functional server-side |
| `/admin/disputes/[disputeCode]` | Admin/operations | Dispute review | Partial | Reads dispute/order/evidence | Resolve/suspend writes | Evidence metadata only | Admin/operations | Responsive | Partial: more-evidence resolution incomplete |
| `/admin/reports` | Admin/operations | Seller concern reports | Partial | Reads reports | No resolution workflow | N/A | Admin/operations | Responsive | Partial |
| `/login` | Public | Sign in | Complete | Auth/profile after action | Auth action | N/A | Public | Responsive | Partial: phone OTP unsupported locally, email fallback works in UI |
| `/signup` | Public | Sign up | Complete | Auth/profile after action | Auth action/profile role | N/A | Public | Responsive | Partial: email fallback; live email confirmation not fully tested |
| `/verify-otp` | Public | Phone OTP verify | Complete | Auth/profile after action | Auth/profile | N/A | Public | Responsive | Blocked locally: phone provider unsupported |
| `/complete-profile` | Authenticated | Missing profile completion | Complete | Reads profile | Updates `profiles` | N/A | Authenticated | Responsive | Partial: live profile creation untested |
| `/logout` | Authenticated | Sign out | Complete | N/A | Auth sign out | N/A | Authenticated | N/A | Untested live |
| `/auth/callback` | Public/Auth | Auth callback | Complete | Reads profile | Exchanges code/session | N/A | Public | N/A | Untested live |
| `/report-concern` | Public/auth currently required on submit | Seller concern report | Partial | Optional seller context | Writes `seller_reports` | N/A | Submit requires auth | Responsive | Partial: public report expectation conflicts with current auth requirement |
| `/protection-charter` | Public | Protection policy | Complete | Reads `policy_documents` | N/A | N/A | Public | Responsive | Connected; DB has policy rows |
| `/dispute-charter` | Public | Dispute policy alias/page | Complete | Reads `policy_documents` | N/A | N/A | Public | Responsive | Connected; DB has policy rows |
| `/unauthorized` | Public/Auth | Access denied | Complete | N/A | N/A | N/A | N/A | Responsive | Complete |
| `/account-restricted` | Public/Auth | Restricted account | Complete | N/A | N/A | N/A | N/A | Responsive | Complete |

## Route Coverage Summary

- Implemented page routes: 28.
- Implemented route handlers: auth callback and logout.
- Highest-risk production gaps: live flow verification, RLS identity tests, admin signed document viewing, storage privacy checks, automated tests.
