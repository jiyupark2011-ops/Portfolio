import { redirect } from "next/navigation";
import { checkIsAdmin, getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Guard #2 (after the proxy): only accounts listed in admin_users may enter. */
export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const userId = await getUserId(supabase);
  if (!userId) redirect("/admin/login");

  const isAdmin = await checkIsAdmin(supabase);
  // Sign out happens in the route handler (Server Components can't write cookies).
  if (!isAdmin) redirect("/auth/signout?error=forbidden");

  return children;
}
