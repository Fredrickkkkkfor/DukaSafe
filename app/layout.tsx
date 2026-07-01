import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { isDemoMode } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dukasafe.co.ke"),
  title: {
    default: "DukaSafe - Verified Commerce. Protected by Design.",
    template: "%s | DukaSafe"
  },
  description: "Verified checkout and buyer-seller protection for Kenyan social commerce.",
  openGraph: {
    title: "DukaSafe",
    description: "Buy safely. Sell confidently.",
    type: "website"
  },
  icons: {
    icon: "/favicon.ico"
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "DukaSafe",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1A3C34"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {isDemoMode && (
          <div className="bg-amber px-4 py-2 text-center text-xs font-black uppercase tracking-wide text-forest">
            Development demo mode - Supabase is not configured and sample data is being shown.
          </div>
        )}
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
