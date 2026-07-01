import { describe, expect, it } from "vitest";
import {
  buyerProtectionFee,
  formatStatusLabel,
  listFromText,
  normalizeSellerSearch,
  orderTotal,
  slugify,
  trustBadgeLabel
} from "../lib/domain";

describe("normalizeSellerSearch", () => {
  it("normalizes DukaSafe seller URLs", () => {
    expect(normalizeSellerSearch("https://dukasafe.co.ke/s/aisha-styles/")).toBe("aisha-styles");
  });

  it("normalizes social and WhatsApp inputs", () => {
    expect(normalizeSellerSearch("https://www.instagram.com/@KayTrendsKE?igsh=abc")).toBe("kaytrendske");
    expect(normalizeSellerSearch("https://wa.me/254700000001")).toBe("254700000001");
  });
});

describe("buyerProtectionFee", () => {
  it("charges a minimum fee for small orders", () => {
    expect(buyerProtectionFee(1800)).toBe(54);
    expect(buyerProtectionFee(500)).toBe(50);
  });

  it("returns zero for invalid or free amounts", () => {
    expect(buyerProtectionFee(0)).toBe(0);
    expect(buyerProtectionFee("not-a-price")).toBe(0);
  });
});

describe("orderTotal", () => {
  it("adds item amount, protection fee, and delivery fee", () => {
    expect(orderTotal(1800, 54, 200)).toBe(2054);
  });
});

describe("status and trust helpers", () => {
  it("formats known and unknown statuses", () => {
    expect(formatStatusLabel("payment_uploaded")).toBe("Payment Uploaded");
    expect(formatStatusLabel("custom_status")).toBe("Custom Status");
  });

  it("derives trust badge labels", () => {
    expect(trustBadgeLabel(95)).toBe("Elite Seller");
    expect(trustBadgeLabel(78)).toBe("Trusted Seller");
    expect(trustBadgeLabel(52)).toBe("Verified");
    expect(trustBadgeLabel(12)).toBe("Under Review");
    expect(trustBadgeLabel(20, "trusted")).toBe("Trusted Seller");
  });
});

describe("text helpers", () => {
  it("builds slugs and lists safely", () => {
    expect(slugify("White Tulle Set!")).toBe("white-tulle-set");
    expect(listFromText("Nairobi, Nakuru, , Naivasha")).toEqual(["Nairobi", "Nakuru", "Naivasha"]);
  });
});
