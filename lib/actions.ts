"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured, requireSupabaseConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleHome } from "@/lib/data";
import { buyerProtectionFee, listFromText, slugify } from "@/lib/domain";

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
  selected_size: z.string().optional(),
  mpesa_receipt_code: z.string().max(40).optional()
});

const disputeSchema = z.object({
  order_id: z.string().uuid(),
  order_code: z.string().min(3),
  type: z.enum(["item_not_received", "wrong_item", "counterfeit_or_fake", "damaged_item", "seller_disappeared", "other"]),
  title: z.string().min(3),
  summary: z.string().min(20),
  buyer_requested_outcome: z.string().optional()
});

const reviewSchema = z.object({
  order_id: z.string().uuid(),
  order_code: z.string().min(3),
  seller_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(5),
  is_public: z.string().optional()
});

const profileSchema = z.object({
  full_name: z.string().min(2),
  phone: phoneSchema.optional().or(z.literal("")),
  preferred_language: z.string().min(2),
  default_location: z.string().optional(),
  role: z.enum(["buyer", "seller"])
});

function value(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function fileFromForm(formData: FormData, key: string) {
  const file = formData.get(key);
  return file instanceof File && file.size > 0 ? file : null;
}

function filesFromForm(formData: FormData, key: string) {
  return formData.getAll(key).filter((item): item is File => item instanceof File && item.size > 0);
}

function uploadValidationMessage(file: File) {
  if (file.size > 8 * 1024 * 1024) return "Files must be smaller than 8MB.";
  const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) return "Upload PNG, JPG, WEBP, or PDF files only.";
  return null;
}

async function uploadFile(bucket: string, userId: string, file: File, folder: string, isPublic = false) {
  const validationMessage = uploadValidationMessage(file);
  if (validationMessage) throw new Error(validationMessage);
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
  if (!profile || !roles.includes(profile.role)) redirect("/unauthorized");
  return { supabase, user, profile };
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/signup?error=missing-supabase-env");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const fullName = value(formData, "full_name");
  const role = value(formData, "role") === "seller" ? "seller" : "buyer";
  const next = value(formData, "next") || (role === "seller" ? "/seller/register" : "/orders");
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
  const next = value(formData, "next");
  const { error } = await supabase.auth.signInWithPassword({ email: value(formData, "email"), password: value(formData, "password") });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (next) redirect(next);
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    redirect(await getRoleHome(profile, user.id));
  }
  redirect("/orders");
}

export async function sendPhoneOtpAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/login?error=missing-supabase-env");
  const phone = phoneSchema.parse(value(formData, "phone"));
  const next = value(formData, "next");
  const mode = value(formData, "mode") || "login";
  const role = value(formData, "role") === "seller" ? "seller" : "buyer";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) {
    const message = error.message.toLowerCase().includes("unsupported phone provider") ? "phone-auth-unavailable" : error.message;
    redirect(`/${mode === "signup" ? "signup" : "login"}?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`);
  }
  redirect(`/verify-otp?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(next)}&mode=${encodeURIComponent(mode)}&role=${encodeURIComponent(role)}`);
}

export async function verifyOtpAction(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/verify-otp?error=missing-supabase-env");
  const phone = phoneSchema.parse(value(formData, "phone"));
  const token = value(formData, "token").replace(/\s/g, "");
  const next = value(formData, "next");
  const mode = value(formData, "mode") || "login";
  if (!/^\d{6}$/.test(token)) redirect(`/verify-otp?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(next)}&mode=${encodeURIComponent(mode)}&error=Enter a valid six-digit code`);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) redirect(`/verify-otp?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(next)}&mode=${encodeURIComponent(mode)}&error=${encodeURIComponent(error.message)}`);
  if (data.user && mode === "signup") {
    const requestedRole = value(formData, "role") === "seller" ? "seller" : "buyer";
    await supabase.from("profiles").update({ role: requestedRole, phone, onboarding_completed: false }).eq("id", data.user.id);
  }
  if (next) redirect(next);
  if (data.user) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    redirect(await getRoleHome(profile, data.user.id));
  }
  redirect("/complete-profile");
}

export async function completeProfileAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsedResult = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsedResult.success) {
    const message = parsedResult.error.issues[0]?.message || "Check your profile details and try again.";
    redirect(`/complete-profile?error=${encodeURIComponent(message)}`);
  }
  const parsed = parsedResult.data;
  const current = await supabase.from("profiles").select("role,onboarding_completed").eq("id", user.id).maybeSingle();
  const lockedRole = current.data?.onboarding_completed && current.data?.role ? current.data.role : null;
  const role = current.data?.role === "admin" || current.data?.role === "operations" ? current.data.role : lockedRole || parsed.role;
  if (role === "seller" && !parsed.phone) redirect("/complete-profile?error=Phone%20number%20is%20required%20for%20seller%20verification.");
  await supabase.from("profiles").update({
    full_name: parsed.full_name,
    phone: parsed.phone || null,
    preferred_language: parsed.preferred_language,
    default_location: parsed.default_location || null,
    role,
    onboarding_completed: true
  }).eq("id", user.id);
  if (role === "seller") redirect("/seller/register");
  redirect("/orders");
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
  const parsedResult = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsedResult.success) {
    const message = parsedResult.error.issues[0]?.message || "Check the product details and try again.";
    redirect(`/seller/create-link?error=${encodeURIComponent(message)}`);
  }
  const parsed = parsedResult.data;
  const { data: seller } = await supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle();
  if (!seller) redirect("/seller/register");
  if (seller.seller_status === "suspended" || seller.seller_status === "banned") redirect("/account-restricted");
  if (!seller.verified || seller.seller_status !== "active" || seller.verification_status !== "approved") redirect("/seller/pending");
  const image = fileFromForm(formData, "product_image");
  let uploaded: { path: string | null; url: string | null } = { path: null, url: null };
  try {
    uploaded = image ? await uploadFile("product-images", user.id, image, "products", true) : uploaded;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed. Check the image and try again.";
    redirect(`/seller/create-link?error=${encodeURIComponent(message)}`);
  }
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
  revalidatePath(`/s/${seller.slug}`);
  redirect(`/seller/create-link?created=${product.id}`);
}

export async function createOrderAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsedResult = checkoutSchema.safeParse(Object.fromEntries(formData));
  const fallbackProductId = value(formData, "product_id");
  if (!parsedResult.success) {
    const message = parsedResult.error.issues[0]?.message || "Check your checkout details and try again.";
    redirect(`/checkout/${fallbackProductId}?error=${encodeURIComponent(message)}`);
  }
  const parsed = parsedResult.data;
  const { data: product } = await supabase.from("products").select("*, sellers(*)").eq("id", parsed.product_id).maybeSingle();
  if (!product) throw new Error("Product not found.");
  const seller = product.sellers;
  if (product.status !== "active" || !seller?.verified || seller.seller_status !== "active" || seller.verification_status !== "approved") {
    redirect(`/checkout/${parsed.product_id}?error=checkout-paused`);
  }
  const proof = fileFromForm(formData, "payment_proof");
  if (!proof) redirect(`/checkout/${parsed.product_id}?error=payment-proof-required`);
  const proofValidation = uploadValidationMessage(proof);
  if (proofValidation) redirect(`/checkout/${parsed.product_id}?error=${encodeURIComponent(proofValidation)}`);
  const protectionFee = buyerProtectionFee(product.price);
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
  let uploaded: { path: string | null; url: string | null };
  try {
    uploaded = await uploadFile("payment-proofs", user.id, proof, `orders/${order.id}`, false);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment proof upload failed.";
    redirect(`/checkout/${parsed.product_id}?error=${encodeURIComponent(message)}`);
  }
  await supabase.from("payments").insert({
    order_id: order.id,
    amount: Number(product.price) + protectionFee,
    status: "proof_uploaded",
    mpesa_receipt_code: parsed.mpesa_receipt_code || null,
    proof_storage_path: uploaded.path,
    payer_phone: parsed.buyer_phone,
    paybill_number: product.sellers?.paybill_number || null,
    till_number: product.sellers?.till_number || null
  });
  await supabase.from("orders").update({ status: "payment_uploaded", payment_status: "proof_uploaded", payment_proof_storage_path: uploaded.path }).eq("id", order.id);
  await supabase.from("order_status_events").insert({ order_id: order.id, changed_by: user.id, old_status: "pending", new_status: "payment_uploaded", title: "Payment proof uploaded", notes: "Buyer attached M-PESA payment evidence.", evidence_storage_path: uploaded.path });
  revalidatePath(`/orders/${order.order_code}`);
  redirect(`/orders/${order.order_code}`);
}

export async function markDispatchedAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const orderId = value(formData, "order_id");
  const orderCode = value(formData, "order_code");
  const { data: order } = await supabase.from("orders").select("id,seller_id,status").eq("id", orderId).maybeSingle();
  if (!order) throw new Error("Order not found.");
  const { data: seller } = await supabase.from("sellers").select("id,user_id").eq("id", order.seller_id).maybeSingle();
  if (!seller || seller.user_id !== user.id) redirect("/unauthorized");
  if (order.status !== "paid") redirect(`/orders/${orderCode}?error=dispatch-requires-paid`);
  const proof = fileFromForm(formData, "delivery_proof");
  if (!proof) redirect(`/orders/${orderCode}?error=delivery-proof-required`);
  const uploaded = await uploadFile("delivery-proofs", user.id, proof, `orders/${orderId}`, false);
  await supabase.from("delivery_proofs").insert({
    order_id: orderId,
    seller_id: seller.id,
    proof_storage_path: uploaded.path,
    notes: value(formData, "notes"),
    courier_name: value(formData, "courier_name") || null,
    tracking_code: value(formData, "tracking_code") || null,
    uploaded_by: user.id
  });
  await supabase.from("orders").update({ status: "dispatched", delivery_proof_storage_path: uploaded.path }).eq("id", orderId);
  await supabase.from("order_status_events").insert({ order_id: orderId, changed_by: user.id, old_status: "paid", new_status: "dispatched", title: "Seller dispatched item", notes: value(formData, "notes"), evidence_storage_path: uploaded.path });
  revalidatePath(`/orders/${orderCode}`);
  redirect(`/orders/${orderCode}`);
}

export async function confirmPaymentAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const orderId = value(formData, "order_id");
  const orderCode = value(formData, "order_code");
  const { data: order } = await supabase.from("orders").select("id,seller_id,status").eq("id", orderId).maybeSingle();
  if (!order) throw new Error("Order not found.");
  const { data: seller } = await supabase.from("sellers").select("user_id").eq("id", order.seller_id).maybeSingle();
  if (!seller || seller.user_id !== user.id) redirect("/unauthorized");
  if (order.status !== "payment_uploaded") redirect(`/orders/${orderCode}?error=payment-not-ready`);
  await supabase.from("orders").update({ status: "paid", payment_status: "verified", paid_at: new Date().toISOString() }).eq("id", orderId);
  await supabase.from("payments").update({ status: "verified", verified_at: new Date().toISOString() }).eq("order_id", orderId);
  await supabase.from("order_status_events").insert({ order_id: orderId, changed_by: user.id, old_status: "payment_uploaded", new_status: "paid", title: "Seller confirmed payment", notes: "Seller reviewed the uploaded proof and accepted payment." });
  revalidatePath(`/orders/${orderCode}`);
  redirect(`/orders/${orderCode}`);
}

export async function flagPaymentAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const orderId = value(formData, "order_id");
  const orderCode = value(formData, "order_code");
  const { data: order } = await supabase.from("orders").select("id,seller_id,status").eq("id", orderId).maybeSingle();
  if (!order) throw new Error("Order not found.");
  const { data: seller } = await supabase.from("sellers").select("user_id").eq("id", order.seller_id).maybeSingle();
  if (!seller || seller.user_id !== user.id) redirect("/unauthorized");
  if (order.status !== "payment_uploaded") redirect(`/orders/${orderCode}?error=payment-not-ready`);
  const notes = value(formData, "notes") || "Payment proof needs DukaSafe review.";
  await supabase.from("order_status_events").insert({ order_id: orderId, changed_by: user.id, new_status: "payment_uploaded", title: "Payment proof flagged for review", notes });
  revalidatePath(`/orders/${orderCode}`);
  redirect(`/orders/${orderCode}`);
}

export async function confirmDeliveryAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const orderId = value(formData, "order_id");
  const orderCode = value(formData, "order_code");
  const { data: order } = await supabase.from("orders").select("id,buyer_id,seller_id,status,refund_window_hours").eq("id", orderId).maybeSingle();
  if (!order) throw new Error("Order not found.");
  if (order.buyer_id !== user.id) redirect("/unauthorized");
  if (!["dispatched", "delivered"].includes(order.status)) redirect(`/orders/${orderCode}?error=delivery-not-ready`);
  const now = new Date();
  const disputeWindowClosesAt = new Date(now.getTime() + Number(order.refund_window_hours || 24) * 60 * 60 * 1000).toISOString();
  await supabase.from("orders").update({
    status: "closed",
    delivered_at: now.toISOString(),
    delivery_otp_confirmed_at: now.toISOString(),
    dispute_window_closes_at: disputeWindowClosesAt
  }).eq("id", orderId);
  await supabase.rpc("recalculate_seller_trust", { p_seller_id: order.seller_id });
  await supabase.from("order_status_events").insert({ order_id: orderId, changed_by: user.id, old_status: order.status, new_status: "closed", title: "Buyer confirmed delivery", notes: "Order closed and seller trust history updated." });
  revalidatePath(`/orders/${orderCode}`);
  redirect(`/orders/${orderCode}?delivered=1`);
}

export async function raiseDisputeAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsedResult = disputeSchema.safeParse(Object.fromEntries(formData));
  const fallbackOrderCode = value(formData, "order_code");
  if (!parsedResult.success) {
    const message = parsedResult.error.issues[0]?.message || "Check the dispute details and try again.";
    redirect(`/orders/${encodeURIComponent(fallbackOrderCode)}/dispute?error=${encodeURIComponent(message)}`);
  }
  const parsed = parsedResult.data;
  const { data: order } = await supabase.from("orders").select("*").eq("id", parsed.order_id).maybeSingle();
  if (!order) throw new Error("Order not found.");
  if (order.buyer_id !== user.id) redirect("/unauthorized");
  const disputeWindowOpen = order.dispute_window_closes_at ? new Date(order.dispute_window_closes_at).getTime() >= Date.now() : false;
  const canDispute = !["cancelled", "refunded", "disputed"].includes(order.status) && (order.status !== "closed" || disputeWindowOpen);
  if (!canDispute) redirect(`/orders/${parsed.order_code}?error=dispute-not-available`);
  const { data: existingDispute } = await supabase
    .from("disputes")
    .select("id")
    .eq("order_id", order.id)
    .in("status", ["open", "awaiting_seller_response", "awaiting_buyer_response", "under_admin_review"])
    .maybeSingle();
  if (existingDispute) redirect(`/orders/${parsed.order_code}?error=dispute-already-open`);
  for (const file of filesFromForm(formData, "evidence")) {
    const validationMessage = uploadValidationMessage(file);
    if (validationMessage) redirect(`/orders/${parsed.order_code}/dispute?error=${encodeURIComponent(validationMessage)}`);
  }
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
  await supabase.from("order_status_events").insert({ order_id: order.id, changed_by: user.id, old_status: order.status, new_status: "disputed", title: "Dispute opened", notes: parsed.title });
  revalidatePath(`/orders/${parsed.order_code}`);
  redirect(`/orders/${parsed.order_code}`);
}

export async function sellerRespondDisputeAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const disputeId = value(formData, "dispute_id");
  const disputeCode = value(formData, "dispute_code");
  const orderId = value(formData, "order_id");
  const response = value(formData, "seller_response");
  if (response.length < 20) throw new Error("Seller response must explain the evidence clearly.");
  for (const file of filesFromForm(formData, "counter_evidence")) {
    const uploaded = await uploadFile("dispute-evidence", user.id, file, `disputes/${disputeId}/seller`, false);
    await supabase.from("dispute_evidence").insert({ dispute_id: disputeId, uploaded_by: user.id, evidence_type: "other", title: file.name, description: "Seller counter-evidence", storage_path: uploaded.path, mime_type: file.type, file_size_bytes: file.size });
  }
  await supabase.from("disputes").update({ seller_response: response, seller_responded_at: new Date().toISOString(), status: "under_admin_review" }).eq("id", disputeId);
  await supabase.from("order_status_events").insert({ order_id: orderId, changed_by: user.id, new_status: "disputed", title: "Seller response submitted", notes: "Seller uploaded response and counter-evidence. DukaSafe operations will review both sides." });
  revalidatePath(`/seller/disputes/${disputeCode}`);
  redirect(`/seller/disputes/${disputeCode}`);
}

export async function createReviewAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = reviewSchema.parse(Object.fromEntries(formData));
  await supabase.from("reviews").insert({
    order_id: parsed.order_id,
    buyer_id: user.id,
    seller_id: parsed.seller_id,
    rating: parsed.rating,
    comment: parsed.comment,
    is_public: parsed.is_public === "on",
    is_verified_order: true
  });
  revalidatePath(`/orders/${parsed.order_code}`);
  redirect(`/orders/${parsed.order_code}?reviewed=1`);
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
  const reason = value(formData, "reason") || "Application rejected after verification review.";
  await supabase.from("sellers").update({ verification_status: "rejected", rejected_at: new Date().toISOString(), rejected_by: user.id, rejection_reason: reason }).eq("id", sellerId);
  await supabase.from("admin_audit_logs").insert({ actor_id: user.id, action: "reject_seller", entity_type: "sellers", entity_id: sellerId, notes: reason });
  revalidatePath("/admin/verification");
}

export async function requestMoreInfoAction(formData: FormData) {
  const { supabase, user } = await requireRole(["admin", "operations"]);
  const sellerId = value(formData, "seller_id");
  const reason = value(formData, "reason") || "Please upload clearer documents or confirm your shop and M-PESA details.";
  await supabase.from("sellers").update({
    verified: false,
    seller_status: "pending",
    verification_status: "needs_more_info",
    rejection_reason: reason
  }).eq("id", sellerId);
  await supabase.from("admin_audit_logs").insert({ actor_id: user.id, action: "request_more_info", entity_type: "sellers", entity_id: sellerId, notes: reason });
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
