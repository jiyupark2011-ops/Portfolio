import { AdminEditor } from "@/components/admin/AdminEditor";
import { getPortfolio } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

/** Edit screen: same layout as the public page plus edit tools. Admin session → hidden rows included. */
export default async function AdminPage() {
  const supabase = await createClient();
  const { profile, sections, items } = await getPortfolio(supabase);

  return <AdminEditor profile={profile} sections={sections} items={items} />;
}
