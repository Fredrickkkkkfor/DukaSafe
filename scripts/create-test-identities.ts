import { assertTestEmail, loadLocalEnv, requireSecret, serviceClient, testEmails } from "./supabase-admin";

type TestIdentity = {
  role: "buyer" | "seller" | "admin";
  email: string;
  passwordEnv: string;
  fullName: string;
};

async function upsertIdentity(identity: TestIdentity) {
  assertTestEmail(identity.email);
  const supabase = serviceClient();
  const password = requireSecret(identity.passwordEnv);

  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const existing = listed.users.find((user) => user.email?.toLowerCase() === identity.email.toLowerCase());

  const userResult = existing
    ? await supabase.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: identity.fullName, test_identity: true }
      })
    : await supabase.auth.admin.createUser({
        email: identity.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: identity.fullName, test_identity: true }
      });

  if (userResult.error) throw userResult.error;
  const user = userResult.data.user;
  if (!user) throw new Error(`Unable to create or update ${identity.role} test user.`);

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email: identity.email,
    full_name: identity.fullName,
    role: identity.role,
    preferred_language: "en",
    default_location: identity.role === "seller" ? "Nairobi" : "Nakuru",
    onboarding_completed: true,
    is_active: true
  }, { onConflict: "id" });

  if (profileError) throw profileError;
  return { role: identity.role, email: identity.email, userId: user.id };
}

async function main() {
  loadLocalEnv();
  const identities: TestIdentity[] = [
    { role: "buyer", email: testEmails.buyer, passwordEnv: "TEST_BUYER_PASSWORD", fullName: "DukaSafe Test Buyer" },
    { role: "seller", email: testEmails.seller, passwordEnv: "TEST_SELLER_PASSWORD", fullName: "DukaSafe Test Seller" },
    { role: "admin", email: testEmails.admin, passwordEnv: "TEST_ADMIN_PASSWORD", fullName: "DukaSafe Test Admin" }
  ];

  const results = [];
  for (const identity of identities) {
    results.push(await upsertIdentity(identity));
  }

  console.log(JSON.stringify({
    createdOrUpdated: results.map((result) => ({ role: result.role, email: result.email })),
    note: "Passwords and keys were not printed."
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : JSON.stringify(error, null, 2));
  process.exitCode = 1;
});
