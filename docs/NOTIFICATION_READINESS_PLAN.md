# Notification Readiness Plan

Last updated: 2026-07-01

## Current Status

Notification workflows are not production-implemented yet. This is a launch risk because DukaSafe depends on timely seller review, dispatch, dispute response, and admin resolution.

Recommended first channel: email.

SMS and WhatsApp should be added later after provider setup, consent language, retry rules, and operational ownership are approved.

## Required Notifications

| Event | Recipient | First channel | Purpose |
|---|---|---|---|
| Seller application submitted | Seller | Email | Confirm review window and next step |
| Seller approved | Seller | Email | Invite seller to create protected links |
| Seller rejected | Seller | Email | Explain reason and appeal/support path |
| More info requested | Seller | Email | Prompt corrected document/social/M-PESA details |
| Buyer order created | Buyer, seller | Email | Confirm protected order record |
| Payment proof uploaded | Seller | Email | Prompt seller proof review |
| Seller dispatches | Buyer | Email | Notify buyer that dispatch proof exists |
| Delivery proof uploaded | Buyer | Email | Prompt tracking/confirmation |
| Dispute opened | Seller, admin | Email | Start seller response and admin visibility |
| Seller response due | Seller | Email | Prevent missed dispute deadline |
| Admin resolves dispute | Buyer, seller | Email | Communicate outcome and next step |

## Implementation Notes

- Use server-side route handlers or server actions only.
- Never expose email provider secrets to the browser.
- Store notification attempt metadata when practical.
- Use idempotency keys for mutation-triggered notifications.
- Avoid sending dispute accusations in notification subject lines.

## Launch Recommendation

Limited beta may proceed with manual operations follow-up if notification gaps are accepted and documented. Production launch should not proceed until at least email notifications are active for seller verification, order creation, payment proof upload, dispatch, dispute open, and dispute resolution.
