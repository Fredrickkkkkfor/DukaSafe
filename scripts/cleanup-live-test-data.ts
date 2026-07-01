import { assertTestEmail, findAuthUserIdByEmail, loadLocalEnv, serviceClient, testEmails } from "./supabase-admin";

async function main() {
  loadLocalEnv();
  const supabase = serviceClient();
  const buyerId = await findAuthUserIdByEmail(testEmails.buyer);
  const sellerUserId = await findAuthUserIdByEmail(testEmails.seller);
  const adminId = await findAuthUserIdByEmail(testEmails.admin);

  for (const email of Object.values(testEmails)) assertTestEmail(email);

  const { data: sellers } = await supabase
    .from("sellers")
    .select("id,user_id")
    .or(`slug.eq.test-dukasafe-seller,shop_name.ilike.%DukaSafe Test Seller%`);
  const sellerIds = (sellers || []).map((seller) => seller.id);

  if (sellerIds.length) {
    const { data: orders } = await supabase.from("orders").select("id").in("seller_id", sellerIds);
    const orderIds = (orders || []).map((order) => order.id);
    if (orderIds.length) {
      const { data: disputes } = await supabase.from("disputes").select("id").in("order_id", orderIds);
      const disputeIds = (disputes || []).map((dispute) => dispute.id);
      if (disputeIds.length) await supabase.from("dispute_evidence").delete().in("dispute_id", disputeIds);
      await supabase.from("disputes").delete().in("order_id", orderIds);
      await supabase.from("delivery_proofs").delete().in("order_id", orderIds);
      await supabase.from("payments").delete().in("order_id", orderIds);
      await supabase.from("order_status_events").delete().in("order_id", orderIds);
      await supabase.from("reviews").delete().in("order_id", orderIds);
      await supabase.from("orders").delete().in("id", orderIds);
    }
    await supabase.from("seller_documents").delete().in("seller_id", sellerIds);
    await supabase.from("products").delete().in("seller_id", sellerIds);
    await supabase.from("admin_audit_logs").delete().in("entity_id", sellerIds);
    await supabase.from("sellers").delete().in("id", sellerIds);
  }

  const profileIds = [buyerId, sellerUserId, adminId].filter((id): id is string => Boolean(id));
  if (profileIds.length) await supabase.from("profiles").delete().in("id", profileIds);

  if (process.env.DUKASAFE_DELETE_TEST_AUTH_USERS === "true") {
    for (const id of profileIds) {
      await supabase.auth.admin.deleteUser(id);
    }
  }

  console.log(JSON.stringify({
    deletedSellerSlugs: sellerIds.length ? ["test-dukasafe-seller"] : [],
    authUsersDeleted: process.env.DUKASAFE_DELETE_TEST_AUTH_USERS === "true",
    note: "Cleanup only targeted test-dukasafe-seller and configured test emails."
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : JSON.stringify(error, null, 2));
  process.exitCode = 1;
});
