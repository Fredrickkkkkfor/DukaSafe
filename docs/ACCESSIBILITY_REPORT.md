# Accessibility Report

Last updated: 2026-07-01

## Current Strengths

- Pages use semantic headings and mostly real buttons/links.
- Inputs are wrapped with visible labels in shared `Input`, `Textarea`, and `Select` components.
- Focus ring utility is applied to controls.
- Major flows avoid color-only status by using text status labels.
- Mobile tap targets are generally large.

## Gaps

- Error messages are visible but not consistently connected to form fields through `aria-describedby`.
- No automated axe/accessibility test has been run.
- File upload inputs lack preview/confirmation states.
- Confirmation dialogs are not implemented for destructive admin actions.
- Product image background divs need better semantic image handling or accessible alternatives.
- Some icon-only/compact elements may need explicit accessible labels if expanded later.

## Required Follow-Up

1. Add automated accessibility checks with Playwright + axe.
2. Add `aria-live` regions for server action success/error states where redirects are not enough.
3. Add confirmation dialogs with focus trapping for admin resolve/reject/suspend actions.
4. Improve file upload accessibility and previews.
5. Verify color contrast against final brand palette.

## Current Accessibility Verdict

Reasonable baseline, not fully audited. Do not claim WCAG conformance yet.
