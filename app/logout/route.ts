import { signOutAction } from "@/lib/actions";

export async function GET() {
  await signOutAction();
}
