import { redirect } from "next/navigation";

export default async function NewOrderRedirect({ params }: { params: Promise<{ productId: string }> }) {
  const route = await params;
  redirect(`/checkout/${route.productId}`);
}
