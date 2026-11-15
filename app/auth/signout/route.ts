import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function signOutAndRedirect(request: NextRequest, error?: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL("/admin/login", request.url);
  if (error === "forbidden") url.searchParams.set("error", "forbidden");
  // 303 so a POST turns into a GET on the login page.
  return NextResponse.redirect(url, { status: 303 });
}

/** Logout button (form POST). */
export async function POST(request: NextRequest) {
  return signOutAndRedirect(request);
}

/** Used by the admin guard when a signed-in account is not an admin. */
export async function GET(request: NextRequest) {
  return signOutAndRedirect(request, request.nextUrl.searchParams.get("error") ?? undefined);
}
