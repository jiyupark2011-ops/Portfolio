import { SECTION_CONFIG, requiredMessage } from "./sections";
import type { ItemInput, ProfileInput, ProfileLink, SectionInput, SectionKey } from "./types";

/** Length limits (PLAN §10-5 plus sensible limits for the other fields — see NOTES.md). */
export const LIMITS = {
  title: 100,
  badge: 30,
  organization: 100,
  date_label: 50,
  description: 1000,
  tag: 30,
  tags: 10,
  url: 500,
  name: 30,
  age_label: 30,
  tagline: 100,
  keyword: 20,
  keywords: 8,
  intro_en: 1500,
  link_label: 30,
  links: 6,
  eyebrow: 30,
  section_title: 30,
  subtitle: 100,
} as const;

/**
 * Adds a scheme when it is missing: "a@b.com" → "mailto:a@b.com", "example.com" → "https://example.com".
 * Returns "" for empty input.
 */
export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:|mailto:)/i.test(value)) return value;
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(value)) return `mailto:${value}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value; // some other scheme → rejected by isAllowedUrl
  return `https://${value}`;
}

/** Only http, https and mailto links are allowed. */
export function isAllowedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === "mailto:") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decodeURIComponent(url.pathname));
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function tooLong(label: string, max: number) {
  return `${label}은(는) ${max}자 이하로 적어 주세요.`;
}

function cleanList(v: unknown, maxItems: number, maxLen: number): string[] | null {
  if (!Array.isArray(v)) return [];
  const list = [...new Set(v.map(str).filter(Boolean))];
  if (list.length > maxItems || list.some((s) => s.length > maxLen)) return null;
  return list;
}

export function validateItemInput(sectionKey: SectionKey, raw: unknown): Result<ItemInput> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const config = SECTION_CONFIG[sectionKey];
  const allowed = new Set(config.fields.map((f) => f.key));
  const label = (key: string) => config.fields.find((f) => f.key === key)?.label ?? key;

  const value: ItemInput = {
    title: str(r.title),
    badge: allowed.has("badge") ? str(r.badge) : "",
    organization: allowed.has("organization") ? str(r.organization) : "",
    date_label: allowed.has("date_label") ? str(r.date_label) : "",
    description: allowed.has("description") ? str(r.description) : "",
    level: null,
    tags: [],
    link_url: null,
  };

  if (!value.title) return { ok: false, error: requiredMessage(label("title")) };
  if (value.title.length > LIMITS.title) return { ok: false, error: tooLong(label("title"), LIMITS.title) };
  if (value.badge.length > LIMITS.badge) return { ok: false, error: tooLong(label("badge"), LIMITS.badge) };
  if (value.organization.length > LIMITS.organization)
    return { ok: false, error: tooLong(label("organization"), LIMITS.organization) };
  if (value.date_label.length > LIMITS.date_label)
    return { ok: false, error: tooLong(label("date_label"), LIMITS.date_label) };
  if (value.description.length > LIMITS.description)
    return { ok: false, error: tooLong(label("description"), LIMITS.description) };

  if (allowed.has("level") && r.level !== null && r.level !== undefined && r.level !== "") {
    const level = Number(r.level);
    if (!Number.isInteger(level) || level < 1 || level > 5) return { ok: false, error: "숙련도는 1~5 사이로 골라 주세요." };
    value.level = level;
  }

  if (allowed.has("tags")) {
    const tags = cleanList(r.tags, LIMITS.tags, LIMITS.tag);
    if (!tags) return { ok: false, error: `사용 도구는 ${LIMITS.tags}개까지, 각각 ${LIMITS.tag}자 이하로 적어 주세요.` };
    value.tags = tags;
  }

  if (allowed.has("link_url")) {
    const url = normalizeUrl(str(r.link_url));
    if (url) {
      if (url.length > LIMITS.url || !isAllowedUrl(url))
        return { ok: false, error: "링크는 http://, https:// 또는 이메일 주소만 넣을 수 있어요." };
      value.link_url = url;
    }
  }

  return { ok: true, value };
}

export function validateProfileInput(raw: unknown): Result<ProfileInput> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const value: ProfileInput = {
    name: str(r.name),
    age_label: str(r.age_label),
    tagline: str(r.tagline),
    intro_en: str(r.intro_en),
    keywords: [],
    links: [],
    allow_indexing: r.allow_indexing === true,
  };

  if (!value.name) return { ok: false, error: requiredMessage("이름") };
  if (value.name.length > LIMITS.name) return { ok: false, error: tooLong("이름", LIMITS.name) };
  if (value.age_label.length > LIMITS.age_label) return { ok: false, error: tooLong("나이·학년", LIMITS.age_label) };
  if (value.tagline.length > LIMITS.tagline) return { ok: false, error: tooLong("한 줄 소개 문구", LIMITS.tagline) };
  if (value.intro_en.length > LIMITS.intro_en) return { ok: false, error: tooLong("영문 자기소개", LIMITS.intro_en) };

  const keywords = cleanList(r.keywords, LIMITS.keywords, LIMITS.keyword);
  if (!keywords) return { ok: false, error: `키워드는 ${LIMITS.keywords}개까지, 각각 ${LIMITS.keyword}자 이하로 적어 주세요.` };
  value.keywords = keywords;

  const rawLinks = Array.isArray(r.links) ? r.links : [];
  const links: ProfileLink[] = [];
  for (const entry of rawLinks) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const label = str(e.label);
    const url = normalizeUrl(str(e.url));
    if (!label && !url) continue;
    if (!url) return { ok: false, error: "연락 링크의 주소를 입력해 주세요." };
    if (label.length > LIMITS.link_label) return { ok: false, error: tooLong("링크 이름", LIMITS.link_label) };
    if (url.length > LIMITS.url || !isAllowedUrl(url))
      return { ok: false, error: "링크는 http://, https:// 또는 이메일 주소만 넣을 수 있어요." };
    links.push({ label, url });
  }
  if (links.length > LIMITS.links) return { ok: false, error: `연락 링크는 ${LIMITS.links}개까지 넣을 수 있어요.` };
  value.links = links;

  return { ok: true, value };
}

export function validateSectionInput(raw: unknown): Result<SectionInput> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const value: SectionInput = {
    eyebrow: str(r.eyebrow),
    title: str(r.title),
    subtitle: str(r.subtitle),
    is_visible: r.is_visible !== false,
  };
  if (!value.title) return { ok: false, error: requiredMessage("섹션 제목") };
  if (value.title.length > LIMITS.section_title) return { ok: false, error: tooLong("섹션 제목", LIMITS.section_title) };
  if (value.eyebrow.length > LIMITS.eyebrow) return { ok: false, error: tooLong("영문 작은 제목", LIMITS.eyebrow) };
  if (value.subtitle.length > LIMITS.subtitle) return { ok: false, error: tooLong("설명 한 줄", LIMITS.subtitle) };
  return { ok: true, value };
}
