import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buyerProtectionFee, slugify } from "../lib/domain";
import { anonClient, loadLocalEnv, requireSecret, serviceClient, testEmails } from "./supabase-admin";

type Check = {
  name: string;
  passed: boolean;
  detail: string;
};

function pngBlob() {
  const bytes = Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1,
    8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0,
    0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
  ]);
  return new Blob([bytes], { type: "image/png" });
}

async function signIn(email: string, passwordEnv: string) {
  const supabase = anonClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: requireSecret(passwordEnv) });
  if (error || !data.user) throw error || new Error(`Unable to sign in ${email}`);
  return { supabase, userId: data.user.id };
}

async function uploadCheck(client: SupabaseClient, bucket: string, path: string) {
  const { error } = await client.storage.from(bucket).upload(path, pngBlob(), {
    contentType: "image/png",
    upsert: true
  });
  return error;
}

async function main() {
  loadLocalEnv();
  const service = serviceClient();
  const publicClient = createClient(requireSecret("NEXT_PUBLIC_SUPABASE_URL"), requireSecret("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const buyer = await signIn(testEmails.buyer, "TEST_BUYER_PASSWORD");
  const seller = await signIn(testEmails.seller, "TEST_SELLER_PASSWORD");
  const admin = await signIn(testEmails.admin, "TEST_ADMIN_PASSWORD");
  const checks: Check[] = [];

  const { data: sellerRow, error: sellerError } = await service.from("sellers").select("*").eq("slug", "test-dukasafe-seller").single();
  if (sellerError || !sellerRow) throw sellerError || new Error("Missing test seller. Run pnpm seed:live-test-data first.");
  const { data: productRow, error: productError } = await service.from("products").select("*").eq("seller_id", sellerRow.id).eq("slug", "e2e-test-white-tulle-set").maybeSingle();
  if (productError || !productRow) throw productError || new Error("Missing test product. Run approved seed first.");
  const { data: orderRow, error: orderError } = await service.from("orders").select("*").eq("product_id", productRow.id).eq("buyer_id", buyer.userId).maybeSingle();
  if (orderError || !orderRow) throw orderError || new Error("Missing test order. Run approved seed with DUKASAFE_SEED_TEST_ORDER=true.");

  const { data: buyerOrder } = await buyer.supabase.from("orders").select("id").eq("id", orderRow.id).maybeSingle();
  checks.push({ name: "Buyer can read own order", passed: buyerOrder?.id === orderRow.id, detail: buyerOrder?.id ? "own order visible" : "own order hidden" });

  const { data: sellerOrder } = await seller.supabase.from("orders").select("id").eq("id", orderRow.id).maybeSingle();
  checks.push({ name: "Seller can read own order", passed: sellerOrder?.id === orderRow.id, detail: sellerOrder?.id ? "seller order visible" : "seller order hidden" });

  const { data: publicOrder, error: publicOrderError } = await publicClient.from("orders").select("id").eq("id", orderRow.id).maybeSingle();
  checks.push({ name: "Public cannot read private order", passed: Boolean(publicOrderError || !publicOrder), detail: publicOrderError ? publicOrderError.message : "public order response had no row" });

  const selfApprove = await seller.supabase.from("sellers").update({ verified: true, trust_score: 99 }).eq("id", sellerRow.id).select("id,verified,trust_score").maybeSingle();
  checks.push({
    name: "Seller cannot mutate own verified/trust_score",
    passed: Boolean(selfApprove.error || !selfApprove.data),
    detail: selfApprove.error ? selfApprove.error.message : "seller self-update was allowed"
  });
  await service.from("sellers").update({
    verified: true,
    trust_score: 78,
    seller_status: "active",
    verification_status: "approved",
    trust_badge: "trusted"
  }).eq("id", sellerRow.id);

  await service.from("sellers").update({ seller_status: "suspended" }).eq("id", sellerRow.id);
  const attackProductName = "E2E ATTACK Suspended Product";
  const suspendedProduct = await seller.supabase.from("products").insert({
    seller_id: sellerRow.id,
    name: attackProductName,
    slug: slugify(attackProductName),
    description: "RLS attack test product that should not be created by suspended sellers.",
    price: 10,
    delivery_options: ["Nairobi"],
    delivery_terms: "Attack test",
    refund_policy: "Attack test",
    refund_window_hours: 24,
    status: "active"
  }).select("id").maybeSingle();
  checks.push({
    name: "Suspended seller cannot create active product",
    passed: Boolean(suspendedProduct.error || !suspendedProduct.data),
    detail: suspendedProduct.error ? suspendedProduct.error.message : "suspended seller product insert was allowed"
  });
  if (suspendedProduct.data?.id) await service.from("products").delete().eq("id", suspendedProduct.data.id);
  await service.from("sellers").update({ seller_status: "active" }).eq("id", sellerRow.id);

  const testPaths = {
    sellerDocument: `${seller.userId}/e2e/seller-document.png`,
    shopPhoto: `${seller.userId}/e2e/shop-photo.png`,
    productImage: `${seller.userId}/e2e/product-image.png`,
    paymentProof: `${buyer.userId}/e2e/payment-proof.png`,
    deliveryProof: `${seller.userId}/e2e/delivery-proof.png`,
    disputeEvidence: `${buyer.userId}/e2e/dispute-evidence.png`
  };

  const uploads = [
    ["Seller uploads own ID document", await uploadCheck(seller.supabase, "seller-documents", testPaths.sellerDocument)],
    ["Seller uploads own shop photo", await uploadCheck(seller.supabase, "shop-photos", testPaths.shopPhoto)],
    ["Seller uploads own product image", await uploadCheck(seller.supabase, "product-images", testPaths.productImage)],
    ["Buyer uploads own payment proof", await uploadCheck(buyer.supabase, "payment-proofs", testPaths.paymentProof)],
    ["Seller uploads own delivery proof", await uploadCheck(seller.supabase, "delivery-proofs", testPaths.deliveryProof)],
    ["Buyer uploads own dispute evidence", await uploadCheck(buyer.supabase, "dispute-evidence", testPaths.disputeEvidence)]
  ] as const;

  for (const [name, error] of uploads) {
    checks.push({ name, passed: !error, detail: error ? error.message : "upload accepted" });
  }

  const publicPrivateRead = await publicClient.storage.from("payment-proofs").download(testPaths.paymentProof);
  checks.push({
    name: "Public cannot read private payment proof",
    passed: Boolean(publicPrivateRead.error),
    detail: publicPrivateRead.error ? publicPrivateRead.error.message : "private proof downloaded publicly"
  });

  const adminSignedUrl = await admin.supabase.storage.from("payment-proofs").createSignedUrl(testPaths.paymentProof, 60);
  checks.push({
    name: "Admin can create signed URL for private proof",
    passed: Boolean(adminSignedUrl.data?.signedUrl && !adminSignedUrl.error),
    detail: adminSignedUrl.error ? adminSignedUrl.error.message : "signed URL created"
  });

  const { data: publicShopUrl } = publicClient.storage.from("shop-photos").getPublicUrl(testPaths.shopPhoto);
  const publicShopRead = await fetch(publicShopUrl.publicUrl);
  checks.push({
    name: "Public can read intended shop photo",
    passed: publicShopRead.ok,
    detail: `HTTP ${publicShopRead.status}`
  });

  const fee = buyerProtectionFee(productRow.price);
  checks.push({ name: "Seeded product fee helper stays deterministic", passed: fee === 54, detail: `fee=${fee}` });

  await Promise.all([
    service.storage.from("seller-documents").remove([testPaths.sellerDocument]),
    service.storage.from("shop-photos").remove([testPaths.shopPhoto]),
    service.storage.from("product-images").remove([testPaths.productImage]),
    service.storage.from("payment-proofs").remove([testPaths.paymentProof]),
    service.storage.from("delivery-proofs").remove([testPaths.deliveryProof]),
    service.storage.from("dispute-evidence").remove([testPaths.disputeEvidence])
  ]);

  const failed = checks.filter((check) => !check.passed);
  console.log(JSON.stringify({ checks, failed: failed.length }, null, 2));
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : JSON.stringify(error, null, 2));
  process.exitCode = 1;
});
