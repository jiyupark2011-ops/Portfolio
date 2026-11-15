import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSectionKey, type Item, type ItemsBySection, type Profile, type ProfileLink, type Section } from "./types";

function normalizeLinks(value: unknown): ProfileLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is { label?: unknown; url?: unknown } => typeof v === "object" && v !== null)
    .map((v) => ({ label: String(v.label ?? ""), url: String(v.url ?? "") }))
    .filter((v) => v.url);
}

/** The single profile row, or null if it can't be read (e.g. DB not set up yet). */
export async function getProfile(supabase: SupabaseClient): Promise<Profile | null> {
  const { data, error } = await supabase.from("profile").select("*").eq("id", 1).maybeSingle();
  if (error) {
    console.error("[data] getProfile failed:", error.message);
    return null;
  }
  if (!data) return null;
  return {
    ...data,
    keywords: data.keywords ?? [],
    links: normalizeLinks(data.links),
  } as Profile;
}

/** Sections ordered by sort_order. RLS hides invisible sections from non-admins. */
export async function getSections(supabase: SupabaseClient): Promise<Section[]> {
  const { data, error } = await supabase.from("sections").select("*").order("sort_order", { ascending: true });
  if (error) {
    console.error("[data] getSections failed:", error.message);
    return [];
  }
  return (data ?? []).filter((s) => isSectionKey(s.key)) as Section[];
}

/** All items grouped by section. RLS hides invisible items from non-admins. */
export async function getItems(supabase: SupabaseClient): Promise<ItemsBySection> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("section_key", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[data] getItems failed:", error.message);
    return {};
  }
  const grouped: ItemsBySection = {};
  for (const row of (data ?? []) as Item[]) {
    if (!isSectionKey(row.section_key)) continue;
    (grouped[row.section_key] ??= []).push({ ...row, tags: row.tags ?? [] });
  }
  return grouped;
}

export async function getPortfolio(supabase: SupabaseClient) {
  const [profile, sections, items] = await Promise.all([
    getProfile(supabase),
    getSections(supabase),
    getItems(supabase),
  ]);
  return { profile, sections, items };
}
