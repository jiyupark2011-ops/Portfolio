import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Signed-in user id from the cookie session (verified), or null. */
export async function getUserId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}

/** Calls the `is_admin()` SQL function. Any error counts as "not admin". */
export async function checkIsAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("[auth] is_admin failed:", error.message);
    return false;
  }
  return data === true;
}
