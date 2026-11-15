"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkIsAdmin } from "@/lib/auth";
import { isValidImagePath } from "@/lib/image";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { isSectionKey, type ActionResult, type SectionKey } from "@/lib/types";
import { validateItemInput, validateProfileInput, validateSectionInput } from "@/lib/validation";

/*
 * All writes run with the signed-in user's cookie session, so RLS is enforced by the DB.
 * Every action re-checks is_admin() first (defense in depth).
 */

const FAIL = "저장에 실패했어요. 다시 시도해 주세요.";
const FORBIDDEN = "편집 권한이 없어요. 다시 로그인해 주세요.";

type Admin = { supabase: SupabaseClient };

async function requireAdmin(): Promise<Admin | null> {
  const supabase = await createClient();
  return (await checkIsAdmin(supabase)) ? { supabase } : null;
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
}

function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Best-effort removal of old Storage files. Never fails the action. */
async function removeFiles(supabase: SupabaseClient, paths: Array<string | null | undefined>) {
  const list = paths.filter((p): p is string => Boolean(p));
  if (list.length === 0) return;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(list);
  if (error) console.error("[actions] storage remove failed:", error.message);
}

/** Re-number a list to 10, 20, 30 … in the given order. */
async function renumber(supabase: SupabaseClient, table: "items" | "sections", idColumn: string, ids: string[]) {
  const results = await Promise.all(
    ids.map((id, i) =>
      supabase
        .from(table)
        .update({ sort_order: (i + 1) * 10 })
        .eq(idColumn, id),
    ),
  );
  return results.every((r) => !r.error);
}

function moveInList(ids: string[], id: string, direction: "up" | "down") {
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ids.length) return null;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/* ---------------- Profile ---------------- */

/**
 * @param photoPath new photo path, `null` to remove the photo, `undefined` to keep it.
 */
export async function updateProfile(input: unknown, photoPath?: string | null): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };

  const parsed = validateProfileInput(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  if (photoPath && !isValidImagePath(photoPath, { kind: "profile" })) return { ok: false, error: FAIL };

  const { data: current } = await admin.supabase.from("profile").select("photo_path").eq("id", 1).maybeSingle();

  const update: Record<string, unknown> = { ...parsed.value };
  if (photoPath !== undefined) update.photo_path = photoPath;

  // The profile row comes from seed.sql (there is no insert policy by design).
  const { data: updated, error } = await admin.supabase.from("profile").update(update).eq("id", 1).select("id");
  if (error || !updated?.length) {
    console.error("[actions] updateProfile:", error?.message ?? "profile row missing (run seed.sql)");
    return { ok: false, error: FAIL };
  }

  if (photoPath !== undefined && current?.photo_path && current.photo_path !== photoPath) {
    await removeFiles(admin.supabase, [current.photo_path]);
  }
  refresh();
  return { ok: true };
}

/* ---------------- Sections ---------------- */

export async function updateSection(key: unknown, input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };
  if (!isSectionKey(key)) return { ok: false, error: FAIL };

  const parsed = validateSectionInput(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const { error } = await admin.supabase.from("sections").update(parsed.value).eq("key", key);
  if (error) {
    console.error("[actions] updateSection:", error.message);
    return { ok: false, error: FAIL };
  }
  refresh();
  return { ok: true };
}

export async function moveSection(key: unknown, direction: "up" | "down"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };
  if (!isSectionKey(key)) return { ok: false, error: FAIL };

  const { data, error } = await admin.supabase.from("sections").select("key").order("sort_order").order("key");
  if (error || !data) return { ok: false, error: FAIL };

  const next = moveInList(
    data.map((s) => s.key as string),
    key,
    direction,
  );
  if (!next) return { ok: true };
  if (!(await renumber(admin.supabase, "sections", "key", next))) return { ok: false, error: FAIL };
  refresh();
  return { ok: true };
}

/* ---------------- Items ---------------- */

export async function createItem(
  sectionKey: unknown,
  input: unknown,
  imagePath?: string | null,
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };
  if (!isSectionKey(sectionKey)) return { ok: false, error: FAIL };

  const parsed = validateItemInput(sectionKey, input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  if (imagePath && !isValidImagePath(imagePath, { kind: "item", sectionKey })) return { ok: false, error: FAIL };

  const { data: last } = await admin.supabase
    .from("items")
    .select("sort_order")
    .eq("section_key", sectionKey)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await admin.supabase
    .from("items")
    .insert({
      ...parsed.value,
      section_key: sectionKey,
      image_path: imagePath ?? null,
      sort_order: (last?.sort_order ?? 0) + 10,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[actions] createItem:", error?.message);
    return { ok: false, error: FAIL };
  }
  refresh();
  return { ok: true, data: { id: data.id } };
}

/**
 * @param imagePath new image path, `null` to remove the image, `undefined` to keep it.
 */
export async function updateItem(id: unknown, input: unknown, imagePath?: string | null): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };
  if (!isUuid(id)) return { ok: false, error: FAIL };

  const { data: current, error: readError } = await admin.supabase
    .from("items")
    .select("section_key, image_path")
    .eq("id", id)
    .maybeSingle();
  if (readError || !current || !isSectionKey(current.section_key)) return { ok: false, error: FAIL };
  const sectionKey: SectionKey = current.section_key;

  const parsed = validateItemInput(sectionKey, input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  if (imagePath && !isValidImagePath(imagePath, { kind: "item", sectionKey })) return { ok: false, error: FAIL };

  const update: Record<string, unknown> = { ...parsed.value };
  if (imagePath !== undefined) update.image_path = imagePath;

  const { error } = await admin.supabase.from("items").update(update).eq("id", id);
  if (error) {
    console.error("[actions] updateItem:", error.message);
    return { ok: false, error: FAIL };
  }

  if (imagePath !== undefined && current.image_path && current.image_path !== imagePath) {
    await removeFiles(admin.supabase, [current.image_path]);
  }
  refresh();
  return { ok: true };
}

export async function setItemVisibility(id: unknown, isVisible: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };
  if (!isUuid(id)) return { ok: false, error: FAIL };

  const { error } = await admin.supabase.from("items").update({ is_visible: isVisible === true }).eq("id", id);
  if (error) return { ok: false, error: FAIL };
  refresh();
  return { ok: true };
}

export async function moveItem(id: unknown, direction: "up" | "down"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };
  if (!isUuid(id)) return { ok: false, error: FAIL };

  const { data: item } = await admin.supabase.from("items").select("section_key").eq("id", id).maybeSingle();
  if (!item) return { ok: false, error: FAIL };

  const { data, error } = await admin.supabase
    .from("items")
    .select("id")
    .eq("section_key", item.section_key)
    .order("sort_order")
    .order("created_at");
  if (error || !data) return { ok: false, error: FAIL };

  const next = moveInList(
    data.map((r) => r.id as string),
    id,
    direction,
  );
  if (!next) return { ok: true };
  if (!(await renumber(admin.supabase, "items", "id", next))) return { ok: false, error: FAIL };
  refresh();
  return { ok: true };
}

export async function deleteItem(id: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };
  if (!isUuid(id)) return { ok: false, error: FAIL };

  const { data, error } = await admin.supabase.from("items").delete().eq("id", id).select("image_path");
  if (error || !data || data.length === 0) {
    console.error("[actions] deleteItem:", error?.message ?? "no row deleted");
    return { ok: false, error: "삭제에 실패했어요. 다시 시도해 주세요." };
  }
  await removeFiles(
    admin.supabase,
    data.map((r) => r.image_path as string | null),
  );
  refresh();
  return { ok: true };
}

/* ---------------- Uploads ---------------- */

/** Removes files that were uploaded in a form but never saved (form closed or photo replaced again). */
export async function discardUploads(paths: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };
  if (!Array.isArray(paths)) return { ok: true };

  const safe = paths.filter(
    (p): p is string =>
      typeof p === "string" &&
      (isValidImagePath(p, { kind: "profile" }) ||
        (p.startsWith("items/") && isSectionKey(p.split("/")[1]) && isValidImagePath(p, { kind: "item", sectionKey: p.split("/")[1] as SectionKey }))),
  );
  if (safe.length === 0) return { ok: true };

  // Never delete a file that is still referenced by the DB.
  const [{ data: items }, { data: profile }] = await Promise.all([
    admin.supabase.from("items").select("image_path").in("image_path", safe),
    admin.supabase.from("profile").select("photo_path").in("photo_path", safe),
  ]);
  const inUse = new Set([
    ...(items ?? []).map((r) => r.image_path as string),
    ...(profile ?? []).map((r) => r.photo_path as string),
  ]);
  await removeFiles(
    admin.supabase,
    safe.filter((p) => !inUse.has(p)),
  );
  return { ok: true };
}
