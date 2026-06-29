export const demoSeller = {
  id: "demo-seller",
  user_id: "demo-user",
  shop_name: "Aisha Styles Nairobi",
  slug: "aisha-styles-nairobi",
  category: "Fashion & Imported Clothing",
  description: "Verified Nairobi seller for curated TikTok, WhatsApp, and Instagram fashion orders.",
  location_city: "Nairobi",
  location_area: "CBD",
  ships_nationwide: true,
  masked_whatsapp: "+254 7** *** 678",
  whatsapp_number: "+254712345678",
  verification_status: "approved",
  seller_status: "active",
  verified: true,
  trust_score: 87,
  trust_badge: "trusted",
  completed_orders_count: 342,
  total_orders_count: 379,
  disputed_orders_count: 2,
  rating_average: 4.8,
  rating_count: 96,
  refund_window_hours: 24,
  delivery_regions: ["Nairobi", "Nakuru", "Naivasha", "Nationwide courier"],
  delivery_terms: "Same-day Nairobi CBD pickup, 24-48hr delivery within major towns.",
  refund_policy: "Returns accepted within 24 hours if the item is wrong, damaged, or materially different from the order terms.",
  created_at: new Date().toISOString()
};

export const demoProducts = [
  {
    id: "demo-product",
    seller_id: demoSeller.id,
    name: "White tulle set",
    slug: "white-tulle-set",
    description: "Elegant white tulle outfit with soft lining, perfect for events and content shoots.",
    price: 1800,
    currency: "KES",
    product_image_url: "",
    gallery_urls: [],
    available_sizes: ["S", "M", "L"],
    delivery_options: ["CBD pickup", "Rider delivery", "Nationwide courier"],
    delivery_terms: demoSeller.delivery_terms,
    refund_policy: demoSeller.refund_policy,
    refund_window_hours: 24,
    special_notes: "Confirm size before dispatch. Proof photos are captured before delivery.",
    status: "active",
    share_url: "/checkout/demo-product"
  }
];

export const demoReviews = [
  { id: "r1", rating: 5, comment: "The order matched the photos and delivery proof was clear.", created_at: new Date().toISOString() },
  { id: "r2", rating: 5, comment: "I liked seeing the trust score before paying.", created_at: new Date().toISOString() },
  { id: "r3", rating: 4, comment: "Fast delivery to Nakuru and helpful updates.", created_at: new Date().toISOString() }
];

export const demoOrder = {
  id: "demo-order",
  order_code: "DS-2406-0187",
  product_id: "demo-product",
  seller_id: demoSeller.id,
  buyer_id: "demo-buyer",
  buyer_full_name: "Wanjiku N.",
  buyer_phone: "+254700123456",
  buyer_email: "buyer@example.com",
  delivery_location: "Kilimani, Nairobi",
  delivery_method: "Rider delivery",
  delivery_notes: "Call on arrival.",
  item_name: "White tulle set",
  item_description: demoProducts[0].description,
  selected_size: "M",
  amount: 1800,
  buyer_protection_fee: 50,
  delivery_fee: 0,
  total_amount: 1850,
  currency: "KES",
  payment_status: "proof_uploaded",
  status: "dispatched",
  refund_window_hours: 24,
  created_at: new Date().toISOString(),
  sellers: demoSeller,
  products: demoProducts[0]
};

export const demoEvents = [
  { title: "Order created", new_status: "pending", notes: "Buyer created a protected checkout order.", created_at: new Date(Date.now() - 86400000).toISOString() },
  { title: "Payment proof uploaded", new_status: "payment_uploaded", notes: "M-PESA screenshot attached for review.", created_at: new Date(Date.now() - 72000000).toISOString() },
  { title: "Seller dispatched item", new_status: "dispatched", notes: "Delivery proof and rider details recorded.", created_at: new Date(Date.now() - 36000000).toISOString() }
];
