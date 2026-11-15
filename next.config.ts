import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "*.supabase.co";

// Dev only: let a phone on the same Wi-Fi open http://<this PC's IP>:3000.
// Without this, Next.js blocks the dev scripts for non-localhost origins and buttons (e.g. login) do nothing.
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((n) => n && n.family === "IPv4" && !n.internal)
  .map((n) => n!.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: lanAddresses,
  // Cache Components is intentionally disabled: this app uses the classic
  // `export const revalidate` + `revalidatePath` model described in PLAN.md (see NOTES.md).
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    qualities: [75],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
