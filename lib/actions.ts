"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured, requireSupabaseConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const phoneSchema = z.string().regex(/^\+?[0-9]{7,15}$/, "Use a valid phone number with country code");
const moneySchema = z.coerce.number().min(0);

const sellerSchema = z.object({
  full_name: z.string().min(2),
  phone: phoneSchema,
  shop_name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().min(10),
  location_city: z.string().min(2),
  location_area: z.string().optional(),
  whatsapp_number: phoneSchema,
  mpesa_number: phoneSchema.optional().or(z.literal("")),
  till_number: z.string().optional(),
  paybill_number: z.string().optional(),
  tiktok_url: z.string().optional(),
  instagram_url: z.string().optional(),
  delivery_regions: z.string().min(2),
  delivery_terms: z.string().min(10),
  refund_policy: z.string().min(10),
  refund_window_hours: z.coerce.number().int().min(0).max(168),
  terms: z.literal("on")
});

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: moneySchema,
  available_sizes: z.string().optional(),
  delivery_options: z.string().min(2),
  delivery_terms: z.string().min(10),
  refund_policy: z.string().min(10),
  refund_window_hours: z.coerce.number().int().min(0).max(168),
  special_notes: z.string().optional()
});

const checkoutSchema = z.object({
  product_id: z.string().uuid(),
  buyer_full_name: z.string().min(2),
  buyer_phone: phoneSchema,
  buyer_email: z.string().email().optional().or(z.literal("")),
  delivery_location: z.string().min(3),
  delivery_method: z.string().min(2),
  delivery_notes: z.string().optional(),
  selected_size: z.string().optional()
});

const disputeSchema = z.object({
  order_id: z.string().uuid(),
  order_code: z.string().min(3),
  type: z.enum(["item_not_received", "wrong_item", "counterfeit_or_fake", "damaged_item", "seller_disappeared", "other"]),
  title: z.string().min(3),
  summary: z.string().min(20),
  buyer_requested_outcome: z.string().optional()
});

function value(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function listFromText(text: string) {
  return text.split(",").map((item) => item.trim()).filter(Boolean);
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "dukasafe-item";
}

function fileFromForm(formData: FormData, key: string) {
  const file = formData.get(key);
  return file instanceof File && file.size > 0 ? file : null;
}

function filesFromForm(formData: FormData, key: string) {
  return formData.getAll(key).filter((item): item is File => item instanceof File && item.size > 0);
}

async function uploadFile(bucket: string, userId: string, file: File, folder: string, isPublic = false) {
  if (file.size > 8 * 1024 * 1024) throw new Error("Files must be smaller than 8MB.");
  const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) throw new Error("Upload PNG, JPG, WEBP, or PDF files only.");
  const supabase = await createSupabaseServerClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  if (!isPublic) return { path, url: null };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

async function requireUser() {
  requireSupabaseConfig();
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
}

async function requireRole(roles: string[]) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile || !roles.includes(profile.role)) redirect("/");
  return { supabase, user, profile };
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/signup?error=missing-supabase-env");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const fullName = value(formData, "full_name");
  const role = value(formData, "role") || "buyer";
  const next = value(formData, "next") || (role === "seller" ? "/seller/register" : "/check");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  if (data.user && role !== "buyer") {
    await supabase.from("profiles").update({ role }).eq("id", data.user.id);
  }
  redirect(next);
}

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/login?error=missing-supabase-env");
  const supabase = await createSupabaseServerClient();
  const next = value(formData, "next") || "/";
  const { error } = await supabase.auth.signInWithPassword({ email: value(formData, "email"), password: value(formData, "password") });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(next);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function registerSellerAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = sellerSchema.parse(Object.fromEntries(formData));
  await supabase.from("profiles").update({ full_name: parsed.full_name, phone: parsed.phone, role: "seller", onboarding_completed: true }).eq("id", user.id);
  const regions = listFromText(parsed.delivery_regions);
  const { data: seller, error } = await supabase.from("sellers").upsert({
    user_id: user.id,
    shop_name: parsed.shop_name,
    slug: slugify(parsed.shop_name),
    category: parsed.category,
    description: parsed.description,
    location_city: parsed.location_city,
    location_area: parsed.location_area || null,
    ships_nationwide: regions.some((r) => r.toLowerCase().includes("nation")),
    whatsapp_number: parsed.whatsapp_number,
    masked_whatsapp: parsed.whatsapp_number.replace(/(\+?\d{3})\d+(\d{3})$/, "$1 *** $2"),
    mpesa_number: parsed.mpesa_number || null,
    till_number: parsed.till_number || null,
    paybill_number: parsed.paybill_number || null,
    tiktok_url: parsed.tiktok_url || null,
    instagram_url: parsed.instagram_url || null,
    social_links: { tiktok: parsed.tiktok_url || null, instagram: parsed.instagram_url || null, whatsapp: parsed.whatsapp_number },
    delivery_regions: regions,
    delivery_terms: parsed.delivery_terms,
    refund_policy: parsed.refund_policy,
    refund_window_hours: parsed.refund_window_hours,
    verification_status: "pending_review",
    seller_status: "pending",
    trust_badge: "under_review",
    submitted_at: new Date().toISOString()
  }, { onConflict: "user_id" }).select("*").single();
  if (error) throw new Error(error.message);

  const idDocument = fileFromForm(formData, "id_document");
  if (idDocument) {
    const uploaded = await uploadFile("seller-documents", user.id, idDocument, "id-documents", false);
    await supabase.from("seller_documents").insert({
      seller_id: seller.id,
      uploaded_by: user.id,
      evidence_type: "id_document",
      title: "ID or passport document",
      storage_path: uploaded.path,
      mime_type: idDocument.type,
      file_size_bytes: idDocument.size
    });
  }
  for (const file of filesFromForm(formData, "shop_photos")) {
    const uploaded = await uploadFile("shop-photos", user.id, file, "shop-photos", true);
    await supabase.from("seller_documents").insert({
      seller_id: seller.id,
      uploaded_by: user.id,
      evidence_type: "shop_photo",
      title: "Shop photo",
      file_url: uploaded.url,
      storage_path: uploaded.path,
      mime_type: file.type,
      file_size_bytes: file.size
    });
  }
  revalidatePath("/seller/dashboard");
  redirect("/seller/pending");
}

export async function createProductAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = productSchema.parse(Object.fromEntries(formData));
  const { data: seller } = await supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle();
  if (!seller) redirect("/seller/register");
  const image = fileFromForm(formData, "product_image");
  const uploaded = image ? await uploadFile("product-images", user.id, image, "products", true) : { path: null, url: null };
  const { data: product, error } = await supabase.from("products").insert({
    seller_id: seller.id,
    name: parsed.name,
    slug: slugify(parsed.name),
    description: parsed.description,
    price: parsed.price,
    product_image_url: uploaded.url,
    product_image_storage_path: uploaded.path,
    available_sizes: listFromText(parsed.available_sizes || ""),
    delivery_options: listFromText(parsed.delivery_options),
    delivery_terms: parsed.delivery_terms,
    refund_policy: parsed.refund_policy,
    refund_window_hours: parsed.refund_window_hours,
    special_notes: parsed.special_notes || null,
    status: "active"
  }).select("*").single();
  if (error) throw new Error(error.message);
  const shareUrl = `/checkout/${product.id}`;
  await supabase.from("products").update({ share_url: shareUrl }).eq("id", product.id);
  revalidatePath("/seller/dashboard");
  redirect(`/seller/create-link?created=${product.id}`);
}

export async function createOrderAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = checkoutSchema.parse(Object.fromEntries(formData));
  const { data: product } = await supabase.from("products").select("*, sellers(*)").eq("id", parsed.product_id).maybeSingle();
  if (!product) throw new Error("Product not found.");
  const protectionFee = Math.max(50, Math.round(Number(product.price) * 0.03));
  const { data: order, error } = await supabase.from("orders").insert({
    product_id: product.id,
    seller_id: product.seller_id,
    buyer_id: user.id,
    buyer_full_name: parsed.buyer_full_name,
    buyer_phone: parsed.buyer_phone,
    buyer_email: parsed.buyer_email || null,
    delivery_location: parsed.delivery_location,
    delivery_method: parsed.delivery_method,
    delivery_notes: parsed.delivery_notes || null,
    selected_size: parsed.selected_size || null,
    item_name: product.name,
    item_description: product.description,
    item_snapshot: product,
    amount: product.price,
    buyer_protection_fee: protectionFee,
    refund_window_hours: product.refund_window_hours,
    status: "pending",
    payment_status: "pending"
  }).select("*").single();
  if (error) throw new Error(error.message);
  const proof = fileFromForm(formData, "payment_proof");
  if (proof) {
    const uploaded = await uploadFile("payment-proofs", user.id, proof, `orders/${order.id}`, false);
    await supabase.from("payments").insert({
      order_id: order.id,
      amount: Number(product.price) + protectionFee,
      status: "proof_uploaded",
      proof_storage_path: uploaded.path,
      payer_phone: parsed.buyer_phone,
      paybill_number: product.sellers?.paybill_number || null,
      till_number: product.sellers?.till_number || null
    });
    await supabase.from("orders").update({ status: "payment_uploaded", payment_status: "proof_uploaded", payment_proof_storage_path: uploaded.path }).eq("id", order.id);
    await supabase.from("order_status_events").insert({ order_id: order.id, changed_by: user.id, new_status: "payment_uploaded", title: "Payment proof uploaded", notes: "Buyer attached M-PESA payment evidence.", evidence_storage_path: uploaded.path });
  }
  revalidatePath(`/orders/${order.order_code}`);
  redirect(`/orders/${order.order_code}`);
}

export async function markDispatchedAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const orderId = value(formData, "order_id");
  const orderCode = value(formData, "order_code");
  const sellerId = value(formData, "seller_id");
  const proof = fileFromForm(formData, "delivery_proof");
  const uploaded = proof ? await uploadFile("delivery-proofs", user.id, proof, `orders/${orderId}`, false) : { path: null, url: null };
  await supabase.from("delivery_proofs").insert({
    order_id: orderId,
    seller_id: sellerId,
    proof_storage_path: uploaded.path,
    notes: value(formData, "notes"),
    courier_name: value(formData, "courier_name") || null,
    tracking_code: value(formData, "tracking_code") || null,
    uploaded_by: user.id
  });
  await supabase.from("orders").update({ status: "dispatched", delivery_proof_storage_path: uploaded.path }).eq("id", orderId);
  await supabase.from("order_status_events").insert({ order_id: orderId, changed_by: user.id, new_status: "dispatched", title: "Seller dispatched item", notes: value(formData, "notes"), evidence_storage_path: uploaded.path });
  revalidatePath(`/orders/${orderCode}`);
  redirect(`/orders/${orderCode}`);
}

export async function confirmDeliveryAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const orderId = value(formData, "order_id");
  const orderCode = value(formData, "order_code");
  await supabase.from("orders").update({ status: "closed", delivery_otp_confirmed_at: new Date().toISOString() }).eq("id", orderId);
  await supabase.from("order_status_events").insert({ order_id: orderId, changed_by: user.id, new_status: "closed", title: "Buyer confirmed delivery", notes: "Order closed and seller trust history updated." });
  revalidatePath(`/orders/${orderCode}`);
  redirect(`/orders/${orderCode}`);
}

export async function raiseDisputeAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = disputeSchema.parse(Object.fromEntries(formData));
  const { data: order } = await supabase.from("orders").select("*").eq("id", parsed.order_id).maybeSingle();
  if (!order) throw new Error("Order not found.");
  const { data: dispute, error } = await supabase.from("disputes").insert({
    order_id: order.id,
    seller_id: order.seller_id,
    buyer_id: order.buyer_id,
    raised_by: user.id,
    type: parsed.type,
    title: parsed.title,
    summary: parsed.summary,
    buyer_requested_outcome: parsed.buyer_requested_outcome || null,
    status: "open"
  }).select("*").single();
  if (error) throw new Error(error.message);
  for (const file of filesFromForm(formData, "evidence")) {
    const uploaded = await uploadFile("dispute-evidence", user.id, file, `disputes/${dispute.id}`, false);
    await supabase.from("dispute_evidence").insert({ dispute_id: dispute.id, uploaded_by: user.id, evidence_type: "chat_screenshot", title: file.name, storage_path: uploaded.path, mime_type: file.type, file_size_bytes: file.size });
  }
  await supabase.from("orders").update({ status: "disputed" }).eq("id", order.id);
  await supabase.from("order_status_events").insert({ order_id: order.id, changed_by: user.id, new_status: "disputed", title: "Dispute opened", notes: parsed.title });
  revalidatePath(`/orders/${parsed.order_code}`);
  redirect(`/orders/${parsed.order_code}`);
}

export async function reportSellerAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from("seller_reports").insert({
    seller_id: value(formData, "seller_id") || null,
    reported_by: user.id,
    reporter_name: value(formData, "reporter_name"),
    reporter_phone: value(formData, "reporter_phone"),
    seller_link_or_phone: value(formData, "seller_link_or_phone"),
    reason: value(formData, "reason"),
    evidence_summary: value(formData, "evidence_summary")
  });
  redirect("/check?reported=1");
}

export async function approveSellerAction(formData: FormData) {
  const { supabase, user } = await requireRole(["admin", "operations"]);
  const sellerId = value(formData, "seller_id");
  const { data: before } = await supabase.from("sellers").select("*").eq("id", sellerId).maybeSingle();
  await supabase.from("sellers").update({ verified: true, seller_status: "active", verification_status: "approved", approved_at: new Date().toISOString(), approved_by: user.id, trust_badge: "trusted" }).eq("id", sellerId);
  await supabase.from("admin_audit_logs").insert({ actor_id: user.id, action: "approve_seller", entity_type: "sellers", entity_id: sellerId, old_values: before, notes: "Seller approved from verification queue." });
  revalidatePath("/admin/verification");
}

export async function rejectSellerAction(formData: FormData) {
  const { supabase, user } = await requireRole(["admin", "operations"]);
  const sellerId = value(formData, "seller_id");
  const reason = value(formData, "reason") || "Application needs more information.";
  await supabase.from("sellers").update({ verification_status: "rejected", rejected_at: new Date().toISOString(), rejected_by: user.id, rejection_reason: reason }).eq("id", sellerId);
  await supabase.from("admin_audit_logs").insert({ actor_id: user.id, action: "reject_seller", entity_type: "sellers", entity_id: sellerId, notes: reason });
  revalidatePath("/admin/verification");
}

export async function resolveDisputeAction(formData: FormData) {
  const { supabase, user } = await requireRole(["admin", "operations"]);
  const disputeId = value(formData, "dispute_id");
  const orderId = value(formData, "order_id");
  const resolution = value(formData, "resolution");
  const notes = value(formData, "resolution_notes");
  const refundAmount = Number(value(formData, "refund_amount") || 0);
  await supabase.from("disputes").update({ resolution, resolution_notes: notes, refund_amount: refundAmount, status: resolution === "dismissed" ? "dismissed" : "resolved", resolved_by: user.id, resolved_at: new Date().toISOString() }).eq("id", disputeId);
  await supabase.from("orders").update({ status: resolution === "refund" || resolution === "partial_refund" ? "refunded" : "closed" }).eq("id", orderId);
  await supabase.from("admin_audit_logs").insert({ actor_id: user.id, action: "resolve_dispute", entity_type: "disputes", entity_id: disputeId, notes });
  await supabase.from("order_status_events").insert({ order_id: orderId, changed_by: user.id, new_status: resolution === "dismissed" ? "closed" : "refunded", title: "Admin resolution issued", notes });
  revalidatePath("/admin/orders");
}

export async function suspendSellerAction(formData: FormData) {
  const { supabase, user } = await requireRole(["admin", "operations"]);
  const sellerId = value(formData, "seller_id");
  await supabase.from("sellers").update({ seller_status: "suspended" }).eq("id", sellerId);
  await supabase.from("admin_audit_logs").insert({ actor_id: user.id, action: "suspend_seller", entity_type: "sellers", entity_id: sellerId, notes: value(formData, "notes") || "Suspended during dispute review." });
  revalidatePath("/admin/orders");
}
