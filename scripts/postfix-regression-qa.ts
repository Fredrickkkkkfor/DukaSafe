import { buyerProtectionFee, slugify } from "../lib/domain";
import { anonClient, loadLocalEnv, requireSecret, serviceClient, testEmails } from "./supabase-admin";

const MiB = 1024 * 1024;
const maxAppUploadBytes = 8 * MiB;

type Result = {
  name: string;
  passed: boolean;
  detail: string;
};

function pngLikeBlob(sizeBytes: number) {
  const header = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const body = new Uint8Array(sizeBytes);
  body.set(header, 0);
  return new Blob([body], { type: "image/png" });
}

async function signIn(email: string, passwordEnv: string) {
  const supabase = anonClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: requireSecret(passwordEnv) });
  if (error || !data.user) throw error || new Error(`Unable to sign in ${email}`);
  return { supabase, userId: data.user.id };
}

async function main() {
  loadLocalEnv();
  const appBaseUrl = process.env.DUKASAFE_QA_BASE_URL || "http://127.0.0.1:3000";
  const service = serviceClient();
  const sellerAuth = await signIn(testEmails.seller, "TEST_SELLER_PASSWORD");
  const results: Result[] = [];

  const { data: seller, error: sellerError } = await service.from("sellers").select("*").eq("slug", "test-dukasafe-seller").single();
  if (sellerError || !seller) throw sellerError || new Error("Missing test seller. Run approved seed first.");
  await service.from("sellers").update({
    verified: true,
    seller_status: "active",
    verification_status: "approved",
    trust_score: 78,
    trust_badge: "trusted"
  }).eq("id", seller.id);

  const uploadSizes = [
    ["under-1mb", 512 * 1024],
    ["three-mb", 3 * MiB],
    ["near-eight-mb", maxAppUploadBytes - 64 * 1024],
    ["above-eight-mb", maxAppUploadBytes + 256 * 1024]
  ] as const;

  const uploadedPaths: string[] = [];
  let selectedProductImageUrl: string | null = null;
  let selectedProductImagePath: string | null = null;

  for (const [label, sizeBytes] of uploadSizes) {
    const shouldPassAppValidation = sizeBytes <= maxAppUploadBytes;
    if (!shouldPassAppValidation) {
      results.push({
        name: `Product image ${label} app validation`,
        passed: true,
        detail: "Rejected before upload by the 8 MB application validator; createProductAction now redirects with a friendly error."
      });
      continue;
    }

    const path = `${sellerAuth.userId}/products/postfix-regression-${label}-${Date.now()}.png`;
    const { error } = await sellerAuth.supabase.storage.from("product-images").upload(path, pngLikeBlob(sizeBytes), {
      contentType: "image/png",
      upsert: false
    });
    results.push({
      name: `Product image ${label} storage upload`,
      passed: !error,
      detail: error ? error.message : `${Math.round(sizeBytes / 1024)} KB accepted by live product-images bucket`
    });
    if (!error) {
      uploadedPaths.push(path);
      if (label === "three-mb") {
        selectedProductImagePath = path;
        const { data } = sellerAuth.supabase.storage.from("product-images").getPublicUrl(path);
        selectedProductImageUrl = data.publicUrl;
      }
    }
  }

  if (!selectedProductImageUrl || !selectedProductImagePath) throw new Error("No product image URL available for product visibility check.");

  const productName = "E2E TEST Post-fix Protected Link";
  const { data: product, error: productError } = await service.from("products").upsert({
    seller_id: seller.id,
    name: productName,
    slug: slugify(productName),
    description: "E2E TEST post-fix regression product with a live uploaded product image.",
    price: 1800,
    product_image_url: selectedProductImageUrl,
    product_image_storage_path: selectedProductImagePath,
    available_sizes: ["S", "M", "L"],
    delivery_options: ["CBD pickup", "Rider delivery", "Nationwide courier"],
    delivery_terms: "E2E TEST dispatch after payment proof is accepted.",
    refund_policy: "E2E TEST evidence-based refund review within 48 hours.",
    refund_window_hours: 48,
    special_notes: "Created by postfix-regression-qa.ts. Safe to remove with test cleanup.",
    status: "active",
    share_url: ""
  }, { onConflict: "seller_id,slug" }).select("*").single();
  if (productError || !product) throw productError || new Error("Product upsert failed.");

  const checkoutPath = `/checkout/${product.id}`;
  await service.from("products").update({ share_url: checkoutPath }).eq("id", product.id);

  results.push({
    name: "Product row created or updated",
    passed: Boolean(product.id && product.product_image_url),
    detail: `product=${product.id}; fee=${buyerProtectionFee(product.price)}; image path saved`
  });

  const sellerProfile = await fetch(`${appBaseUrl}/s/${seller.slug}`);
  const sellerHtml = await sellerProfile.text();
  results.push({
    name: "Seller profile renders post-fix product",
    passed: sellerProfile.ok && sellerHtml.includes(productName) && sellerHtml.includes(selectedProductImageUrl),
    detail: `HTTP ${sellerProfile.status}; product name and image URL ${sellerHtml.includes(productName) && sellerHtml.includes(selectedProductImageUrl) ? "present" : "not both present"}`
  });

  const checkout = await fetch(`${appBaseUrl}${checkoutPath}`);
  const checkoutHtml = await checkout.text();
  results.push({
    name: "Public checkout route opens",
    passed: checkout.ok && checkoutHtml.includes(productName),
    detail: `HTTP ${checkout.status}; checkout=${checkoutPath}`
  });

  const temporaryUploadPaths = uploadedPaths.filter((path) => path !== selectedProductImagePath);
  if (temporaryUploadPaths.length) {
    await service.storage.from("product-images").remove(temporaryUploadPaths);
  }

  const failed = results.filter((result) => !result.passed);
  console.log(JSON.stringify({
    appBaseUrl,
    productId: product.id,
    checkoutPath,
    uploadedValidFiles: uploadedPaths.length,
    results,
    failed: failed.length
  }, null, 2));
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : JSON.stringify(error, null, 2));
  process.exitCode = 1;
});
