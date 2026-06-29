import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
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
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
