import { buyerProtectionFee, slugify } from "../lib/domain";
import { assertTestEmail, findAuthUserIdByEmail, loadLocalEnv, serviceClient, testEmails } from "./supabase-admin";

async function requireProfile(email: string) {
  assertTestEmail(email);
  const supabase = serviceClient();
  const id = await findAuthUserIdByEmail(email);
  if (!id) throw new Error(`Missing auth user for ${email}. Run pnpm create:test-identities first.`);
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Missing profile for ${email}. Run pnpm create:test-identities first.`);
  return data;
}

async function main() {
  loadLocalEnv();
  const supabase = serviceClient();
  const buyer = await requireProfile(testEmails.buyer);
  const sellerProfile = await requireProfile(testEmails.seller);
  const approved = process.env.DUKASAFE_TEST_SELLER_APPROVED === "true";

  const { data: seller, error: sellerError } = await supabase.from("sellers").upsert({
    user_id: sellerProfile.id,
    shop_name: "DukaSafe Test Seller",
    slug: "test-dukasafe-seller",
    category: "Fashion",
    description: "E2E TEST seller profile for DukaSafe production-readiness verification.",
    location_city: "Nairobi",
    location_area: "Kilimani",
    whatsapp_number: "+254700000002",
    masked_whatsapp: "+2547***0002",
    mpesa_number: "+254700000002",
    till_number: "123456",
    tiktok_url: "https://www.tiktok.com/@dukasafe.test",
    instagram_url: "https://www.instagram.com/dukasafe.test",
    verification_status: approved ? "approved" : "submitted",
    seller_status: approved ? "active" : "pending",
    verified: approved,
    trust_score: approved ? 78 : 50,
    trust_badge: approved ? "trusted" : "under_review",
    refund_window_hours: 48,
    delivery_regions: ["Nairobi", "Nakuru", "Naivasha"],
    delivery_terms: "E2E TEST delivery terms for Nairobi, Nakuru, and Naivasha.",
    refund_policy: "E2E TEST refund policy: evidence-based review within 48 hours.",
    submitted_at: new Date().toISOString(),
    profile_visibility: "public"
  }, { onConflict: "user_id" }).select("*").single();
  if (sellerError) throw sellerError;

  const { data: existingDocument, error: existingDocumentError } = await supabase
    .from("seller_documents")
    .select("id")
    .eq("seller_id", seller.id)
    .eq("title", "E2E TEST placeholder document record")
    .maybeSingle();
  if (existingDocumentError) throw existingDocumentError;
  if (!existingDocument) {
    const { error: documentError } = await supabase.from("seller_documents").insert({
      seller_id: seller.id,
      uploaded_by: sellerProfile.id,
      evidence_type: "id_document",
      title: "E2E TEST placeholder document record",
      storage_path: `${sellerProfile.id}/id-documents/e2e-test-placeholder.txt`,
      mime_type: "text/plain",
      file_size_bytes: 0
    });
    if (documentError) throw documentError;
  }

  let productId: string | null = null;
  if (approved) {
    const productName = "E2E TEST White Tulle Set";
    const { data: product, error: productError } = await supabase.from("products").upsert({
      seller_id: seller.id,
      name: productName,
      slug: slugify(productName),
      description: "E2E TEST protected checkout product used for DukaSafe staging verification.",
      price: 1800,
      available_sizes: ["S", "M", "L"],
      delivery_options: ["Nairobi rider", "Nakuru parcel", "Naivasha parcel"],
      delivery_terms: "Dispatch after payment proof is verified.",
      refund_policy: "48-hour evidence review window.",
      refund_window_hours: 48,
      special_notes: "Created by seed-live-test-data.ts. Safe to clean up.",
      status: "active",
      share_url: ""
    }, { onConflict: "seller_id,slug" }).select("*").single();
    if (productError) throw productError;
    productId = product.id;
    await supabase.from("products").update({ share_url: `/checkout/${product.id}` }).eq("id", product.id);

    if (process.env.DUKASAFE_SEED_TEST_ORDER === "true") {
      const fee = buyerProtectionFee(product.price);
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id,order_code")
        .eq("buyer_id", buyer.id)
        .eq("product_id", product.id)
        .eq("item_name", product.name)
        .maybeSingle();
      if (!existingOrder) {
        const { data: order, error: orderError } = await supabase.from("orders").insert({
          product_id: product.id,
          seller_id: seller.id,
          buyer_id: buyer.id,
          buyer_full_name: "DukaSafe Test Buyer",
          buyer_phone: "+254700000001",
          buyer_email: testEmails.buyer,
          delivery_location: "E2E TEST delivery address, Nakuru",
          delivery_method: "Parcel delivery",
          item_name: product.name,
          item_description: product.description,
          item_snapshot: product,
          selected_size: "M",
          amount: product.price,
          buyer_protection_fee: fee,
          refund_window_hours: 48,
          status: "payment_uploaded",
          payment_status: "proof_uploaded",
          payment_proof_storage_path: `${buyer.id}/orders/e2e-test-placeholder.txt`
        }).select("id,order_code").single();
        if (orderError) throw orderError;
        await supabase.from("payments").insert({
          order_id: order.id,
          amount: Number(product.price) + fee,
          status: "proof_uploaded",
          payer_phone: "+254700000001",
          proof_storage_path: `${buyer.id}/orders/e2e-test-placeholder.txt`
        });
        await supabase.from("order_status_events").insert({
          order_id: order.id,
          changed_by: buyer.id,
          new_status: "payment_uploaded",
          title: "E2E TEST payment proof placeholder",
          notes: "Seeded placeholder row. Real flow still requires browser upload verification."
        });
      }
    }
  }

  console.log(JSON.stringify({
    sellerSlug: seller.slug,
    sellerStatus: seller.seller_status,
    productSeeded: Boolean(productId),
    orderSeedRequested: process.env.DUKASAFE_SEED_TEST_ORDER === "true",
    note: "Seed data is marked with E2E TEST/test-dukasafe-seller."
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : JSON.stringify(error, null, 2));
  process.exitCode = 1;
});
