import { createSupabaseServerClient } from "@/lib/supabase/server";
import { demoEvents, demoOrder, demoProducts, demoReviews, demoSeller } from "@/lib/demo";
import { isSupabaseConfigured } from "@/lib/env";

export async function getCurrentUserAndProfile() {
  if (!isSupabaseConfigured) return { user: null, profile: null };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { user, profile };
}

export async function getSellerBySlug(slug: string) {
  if (slug === demoSeller.slug || !isSupabaseConfigured) return { seller: demoSeller, products: demoProducts, reviews: demoReviews };
  const supabase = await createSupabaseServerClient();
  const { data: seller } = await supabase.from("sellers").select("*").eq("slug", slug).maybeSingle();
  if (!seller) return { seller: null, products: [], reviews: [] };
  const [{ data: products }, { data: reviews }] = await Promise.all([
    supabase.from("products").select("*").eq("seller_id", seller.id).eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("reviews").select("*").eq("seller_id", seller.id).eq("is_public", true).order("created_at", { ascending: false }).limit(6)
  ]);
  return { seller, products: products || [], reviews: reviews || [] };
}

export async function searchSellers(query: string) {
  const q = query.trim();
  if (!q) return [];
  if (!isSupabaseConfigured) {
    return [demoSeller].filter((seller) => `${seller.shop_name} ${seller.slug} ${seller.whatsapp_number}`.toLowerCase().includes(q.toLowerCase().replace("https://", "")));
  }
  const supabase = await createSupabaseServerClient();
  const cleaned = q.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const { data } = await supabase
    .from("sellers")
    .select("*")
    .or(`shop_name.ilike.%${cleaned}%,slug.ilike.%${cleaned}%,whatsapp_number.ilike.%${cleaned}%`)
    .limit(8);
  return data || [];
}

export async function getProductForCheckout(productId: string) {
  if (productId === "demo-product" || !isSupabaseConfigured) return { product: demoProducts[0], seller: demoSeller };
  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase.from("products").select("*, sellers(*)").eq("id", productId).maybeSingle();
  if (!product) return { product: null, seller: null };
  return { product, seller: product.sellers };
}

export async function getOrderByCode(orderCode: string) {
  if (orderCode === demoOrder.order_code || !isSupabaseConfigured) return { order: demoOrder, events: demoEvents, payments: [], deliveryProofs: [], disputes: [] };
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase.from("orders").select("*, sellers(*), products(*)").eq("order_code", orderCode).maybeSingle();
  if (!order) return { order: null, events: [], payments: [], deliveryProofs: [], disputes: [] };
  const [events, payments, deliveryProofs, disputes] = await Promise.all([
    supabase.from("order_status_events").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
    supabase.from("payments").select("*").eq("order_id", order.id).order("created_at", { ascending: false }),
    supabase.from("delivery_proofs").select("*").eq("order_id", order.id).order("created_at", { ascending: false }),
    supabase.from("disputes").select("*").eq("order_id", order.id).order("created_at", { ascending: false })
  ]);
  return { order, events: events.data || [], payments: payments.data || [], deliveryProofs: deliveryProofs.data || [], disputes: disputes.data || [] };
}

export async function getBuyerOrders() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !isSupabaseConfigured) return { user, profile, orders: [demoOrder] };
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("*, sellers(shop_name, slug, trust_score, trust_badge), products(name)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });
  return { user, profile, orders: data || [] };
}

export async function getSellerWorkspace() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !isSupabaseConfigured) return { user, profile, seller: null, products: [], orders: [], reviews: [], disputes: [] };
  const supabase = await createSupabaseServerClient();
  const { data: seller } = await supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle();
  if (!seller) return { user, profile, seller: null, products: [], orders: [], reviews: [], disputes: [] };
  const [products, orders, reviews, disputes] = await Promise.all([
    supabase.from("products").select("*").eq("seller_id", seller.id).order("created_at", { ascending: false }),
    supabase.from("orders").select("*, products(name)").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("reviews").select("*").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("disputes").select("*, orders(order_code)").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(10)
  ]);
  return { user, profile, seller, products: products.data || [], orders: orders.data || [], reviews: reviews.data || [], disputes: disputes.data || [] };
}

export async function getSellerOrders() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !isSupabaseConfigured) return { user, profile, seller: demoSeller, orders: [demoOrder] };
  const supabase = await createSupabaseServerClient();
  const { data: seller } = await supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle();
  if (!seller) return { user, profile, seller: null, orders: [] };
  const { data: orders } = await supabase
    .from("orders")
    .select("*, products(name), payments(*), delivery_proofs(*), disputes(*)")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });
  return { user, profile, seller, orders: orders || [] };
}

export async function getSellerDisputes() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !isSupabaseConfigured) return { user, profile, seller: demoSeller, disputes: [] };
  const supabase = await createSupabaseServerClient();
  const { data: seller } = await supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle();
  if (!seller) return { user, profile, seller: null, disputes: [] };
  const { data: disputes } = await supabase
    .from("disputes")
    .select("*, orders(order_code, item_name, amount, status), dispute_evidence(*)")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });
  return { user, profile, seller, disputes: disputes || [] };
}

export async function getSellerDisputeByCode(disputeCode: string) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !isSupabaseConfigured) return { user, profile, dispute: null };
  const supabase = await createSupabaseServerClient();
  const { data: dispute } = await supabase
    .from("disputes")
    .select("*, orders(*), sellers(*), dispute_evidence(*)")
    .eq("dispute_code", disputeCode)
    .maybeSingle();
  return { user, profile, dispute };
}

export async function getAdminVerificationQueue() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("sellers").select("*, seller_documents(*)").in("verification_status", ["submitted", "pending_review", "needs_more_info"]).order("submitted_at", { ascending: true });
  return data || [];
}

export async function getAdminOrders() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("orders").select("*, sellers(shop_name, slug), payments(*), delivery_proofs(*), disputes(*)").order("created_at", { ascending: false }).limit(80);
  return data || [];
}

export async function getAdminReports() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("seller_reports")
    .select("*, sellers(shop_name, slug, trust_score, seller_status)")
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
}

export async function getDisputeByCode(disputeCode: string) {
  const supabase = await createSupabaseServerClient();
  const { data: dispute } = await supabase.from("disputes").select("*, orders(*), sellers(*), dispute_evidence(*)").eq("dispute_code", disputeCode).maybeSingle();
  return dispute;
}

export async function getPolicy(slug: string) {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("policy_documents").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  return data;
}
