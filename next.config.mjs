import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";

const root = dirname(fileURLToPath(import.meta.url));
const lanDevOrigins = Object.values(networkInterfaces())
  .flat()
  .filter((networkInterface) => networkInterface?.family === "IPv4" && !networkInterface.internal)
  .map((networkInterface) => networkInterface.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: lanDevOrigins,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  },
  turbopack: {
    root
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" }
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;
