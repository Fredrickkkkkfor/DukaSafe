import { Card, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-7xl place-items-center px-4">
      <Card className="max-w-md text-center">
        <h1 className="text-4xl font-black text-forest">Page not found</h1>
        <p className="mt-3 text-charcoal/70">This DukaSafe page may have moved or the link is no longer active.</p>
        <LinkButton href="/check" className="mt-5">Check a Seller</LinkButton>
      </Card>
    </main>
  );
}
