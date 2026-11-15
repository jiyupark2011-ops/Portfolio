export const SECTION_KEYS = ["awards", "certificates", "skills", "works", "clubs", "volunteer", "interests"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === "string" && (SECTION_KEYS as readonly string[]).includes(value);
}

export type ProfileLink = {
  label: string;
  url: string;
};

export type Profile = {
  id: number;
  name: string;
  age_label: string;
  tagline: string;
  keywords: string[];
  intro_en: string;
  photo_path: string | null;
  links: ProfileLink[];
  allow_indexing: boolean;
  updated_at: string;
};

export type Section = {
  key: SectionKey;
  eyebrow: string;
  title: string;
  subtitle: string;
  sort_order: number;
  is_visible: boolean;
};

export type Item = {
  id: string;
  section_key: SectionKey;
  title: string;
  badge: string;
  organization: string;
  date_label: string;
  description: string;
  level: number | null;
  tags: string[];
  image_path: string | null;
  link_url: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type ItemsBySection = Partial<Record<SectionKey, Item[]>>;

/** Editable item fields (what the item form sends to the server). */
export type ItemInput = Pick<
  Item,
  "title" | "badge" | "organization" | "date_label" | "description" | "level" | "tags" | "link_url"
>;

/** Editable profile fields (photo is handled separately by the uploader). */
export type ProfileInput = Pick<
  Profile,
  "name" | "age_label" | "tagline" | "keywords" | "intro_en" | "links" | "allow_indexing"
>;

export type SectionInput = Pick<Section, "eyebrow" | "title" | "subtitle" | "is_visible">;

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
