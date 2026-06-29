"use client";

import { Card, Button } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-screen max-w-7xl place-items-center px-4">
      <Card className="max-w-lg text-center">
        <h1 className="text-3xl font-black text-forest">Something needs attention</h1>
        <p className="mt-3 text-sm text-charcoal/70">{error.message || "The request could not be completed."}</p>
        <Button type="button" onClick={reset} className="mt-5">Try again</Button>
      </Card>
    </main>
  );
}
