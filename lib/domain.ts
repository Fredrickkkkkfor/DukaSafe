export const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending: "Pending",
  pending_review: "Under Review",
  needs_more_info: "Needs More Info",
  approved: "Verified",
  rejected: "Rejected",
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
  archived: "Archived",
  under_review: "Under Review",
  verified: "Verified",
  trusted: "Trusted Seller",
  elite: "Elite Seller",
  none: "No Badge",
  payment_uploaded: "Payment Uploaded",
  paid: "Paid",
  dispatched: "Dispatched",
  delivered: "Delivered",
  closed: "Closed",
  disputed: "Disputed",
  refunded: "Refunded",
  cancelled: "Cancelled",
  proof_uploaded: "Proof Uploaded",
  failed: "Failed",
  open: "Open",
  awaiting_seller_response: "Waiting for Seller",
  awaiting_buyer_response: "Waiting for Buyer",
  under_admin_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
  item_not_received: "Item Not Received",
  wrong_item: "Wrong Item",
  counterfeit_or_fake: "Counterfeit or Fake",
  damaged_item: "Damaged Item",
  seller_disappeared: "Seller Disappeared",
  other: "Other",
  uploaded: "Uploaded"
};

export function formatStatusLabel(status?: string | null) {
  if (!status) return "Unknown";
  return statusLabels[status] || status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizeSellerSearch(input: string) {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return "";

  return trimmed
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/^m\./, "")
    .replace(/^(tiktok|instagram)\.com\/@?/, "")
    .replace(/^wa\.me\//, "")
    .replace(/^api\.whatsapp\.com\/send\?phone=/, "")
    .replace(/^whatsapp:\/\/send\?phone=/, "")
    .replace(/^dukasafe\.(co\.ke|ke|com)\/s\//, "")
    .replace(/^\/?s\//, "")
    .replace(/[?#].*$/, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "")
    .trim();
}

export function buyerProtectionFee(amount: number | string) {
  const price = Number(amount);
  if (!Number.isFinite(price) || price <= 0) return 0;
  return Math.max(50, Math.round(price * 0.03));
}

export function orderTotal(amount: number | string, protectionFee = buyerProtectionFee(amount), deliveryFee: number | string = 0) {
  const price = Number(amount);
  const delivery = Number(deliveryFee);
  return Math.max(0, price || 0) + Math.max(0, protectionFee || 0) + Math.max(0, delivery || 0);
}

export function trustBadgeLabel(score: number | string | null | undefined, badge?: string | null) {
  const numeric = Number(score ?? 0);
  if (badge && badge !== "none") return formatStatusLabel(badge);
  if (numeric >= 90) return "Elite Seller";
  if (numeric >= 70) return "Trusted Seller";
  if (numeric >= 50) return "Verified";
  return "Under Review";
}

export function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "dukasafe-item";
}

export function listFromText(text: string) {
  return text.split(",").map((item) => item.trim()).filter(Boolean);
}
