import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only the admin area and auth routes need session handling.
  // The public page stays cookie-free so it can be cached.
  matcher: ["/admin/:path*", "/auth/:path*"],
};
