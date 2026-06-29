import { Card } from "@/components/ui";

export default function Loading() {
  return (
    <main className="mx-auto grid min-h-screen max-w-7xl place-items-center px-4">
      <Card className="w-full max-w-md">
        <div className="h-3 w-28 animate-pulse rounded-full bg-forest/15" />
        <div className="mt-5 h-8 w-3/4 animate-pulse rounded-2xl bg-forest/10" />
        <div className="mt-3 h-4 w-full animate-pulse rounded-2xl bg-forest/10" />
        <div className="mt-2 h-4 w-5/6 animate-pulse rounded-2xl bg-forest/10" />
      </Card>
    </main>
  );
}
