import {
  Award,
  BadgeCheck,
  HandHeart,
  Heart,
  Lightbulb,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SectionKey } from "./types";

/**
 * Per-section form fields and guide texts (PLAN.md §7).
 * Guide texts live in code only — never render them on the public page.
 */

export type Accent = "coral" | "primary" | "mint" | "sun";

export type ItemFieldKey =
  | "title"
  | "badge"
  | "organization"
  | "date_label"
  | "description"
  | "level"
  | "tags"
  | "image"
  | "link_url";

export type FieldConfig = {
  key: ItemFieldKey;
  label: string;
  placeholder?: string;
  help?: string;
  required?: boolean;
};

export type SectionConfig = {
  key: SectionKey;
  accent: Accent;
  icon: LucideIcon;
  /** Grid columns on the public page. */
  layout: "list2" | "grid3";
  fields: FieldConfig[];
  /** Admin-only empty-state text. */
  emptyText: string;
};

export const SECTION_CONFIG: Record<SectionKey, SectionConfig> = {
  awards: {
    key: "awards",
    accent: "coral",
    icon: Trophy,
    layout: "list2",
    emptyText: "받은 상을 추가해 보세요. 교내·교외 대회, 공모전 모두 좋아요.",
    fields: [
      { key: "title", label: "대회명", required: true, placeholder: "예) 제3회 학교안전사고 데이터 분석 활용 경진대회" },
      { key: "badge", label: "수상 등급", placeholder: "예) 대상, 최우수상, 3rd place" },
      { key: "organization", label: "주최 기관", placeholder: "예) 교육부, ○○시" },
      { key: "date_label", label: "날짜", placeholder: "예) 2026.07" },
      {
        key: "description",
        label: "설명",
        placeholder: "무엇을 만들었는지, 내 역할, 배운 점",
        help: "무엇을 만들었는지, 내 역할, 배운 점을 2~3문장으로 적어 주세요.",
      },
      { key: "image", label: "사진", help: "상장이나 발표 사진" },
      { key: "link_url", label: "링크", placeholder: "https://", help: "관련 기사나 결과물 주소(선택)" },
    ],
  },
  certificates: {
    key: "certificates",
    accent: "primary",
    icon: BadgeCheck,
    layout: "list2",
    emptyText: "취득한 자격증을 추가해 보세요.",
    fields: [
      { key: "title", label: "자격증명", required: true, placeholder: "예) 한자능력검정시험" },
      { key: "badge", label: "급수/점수", placeholder: "예) 5급" },
      { key: "organization", label: "발급 기관", placeholder: "예) 한국어문회" },
      { key: "date_label", label: "취득일", placeholder: "예) 2025.11" },
      { key: "image", label: "사진", help: "자격증 사진(개인정보 가리기)" },
    ],
  },
  skills: {
    key: "skills",
    accent: "mint",
    icon: Sparkles,
    layout: "grid3",
    emptyText: "내가 할 줄 아는 것을 추가해 보세요. 코딩, 디자인, 외국어, 악기 등 무엇이든 좋아요.",
    fields: [
      { key: "title", label: "기술명", required: true, placeholder: "예) Python, 영상 편집, 드럼" },
      { key: "badge", label: "분류", placeholder: "예) 코딩 / 디자인 / 언어 / 악기" },
      { key: "level", label: "숙련도", help: "1(입문)~5(능숙) 별 선택" },
      {
        key: "description",
        label: "설명",
        placeholder: "예) 데이터 분석 대회에서 pandas로 사고 데이터를 정리했어요.",
        help: "이 기술을 어디에 써 봤는지 한 줄로 적어 주세요.",
      },
    ],
  },
  works: {
    key: "works",
    accent: "primary",
    icon: Lightbulb,
    layout: "grid3",
    emptyText: "직접 만든 결과물을 추가해 보세요. 대회 출품작, 수행평가, 개인 프로젝트 모두 좋아요.",
    fields: [
      { key: "title", label: "작품 이름", required: true, placeholder: "예) 학교 안전사고 데이터 대시보드" },
      { key: "date_label", label: "제작 기간", placeholder: "예) 2026.04 ~ 2026.06" },
      {
        key: "description",
        label: "설명",
        placeholder: "왜 만들었는지, 어떻게 만들었는지, 결과는 어땠는지",
        help: "왜 만들었는지, 어떻게 만들었는지, 결과는 어땠는지 적어 주세요.",
      },
      { key: "tags", label: "사용 도구", placeholder: "예) Python, Figma", help: "입력하고 Enter로 추가해요." },
      { key: "image", label: "대표 이미지", help: "작품 화면이나 결과물 사진" },
      { key: "link_url", label: "링크", placeholder: "https://", help: "작품 주소나 영상 링크(선택)" },
    ],
  },
  clubs: {
    key: "clubs",
    accent: "sun",
    icon: Users,
    layout: "list2",
    emptyText: "참여한 동아리를 추가해 보세요.",
    fields: [
      { key: "title", label: "동아리명", required: true, placeholder: "예) 농구부" },
      { key: "badge", label: "역할", placeholder: "예) 부원, 부장, 보컬" },
      { key: "date_label", label: "활동 기간", placeholder: "예) 2025.03 ~ 현재" },
      {
        key: "description",
        label: "설명",
        placeholder: "어떤 활동을 했고 무엇을 배웠는지",
        help: "어떤 활동을 했고 무엇을 배웠는지 적어 주세요.",
      },
      { key: "image", label: "사진", help: "활동 사진(다른 친구 얼굴은 동의 받고)" },
    ],
  },
  volunteer: {
    key: "volunteer",
    accent: "mint",
    icon: HandHeart,
    layout: "list2",
    emptyText: "참여한 봉사활동을 추가해 보세요.",
    fields: [
      { key: "title", label: "활동명", required: true, placeholder: "예) g2f 봉사" },
      { key: "organization", label: "기관/장소", placeholder: "예) ○○복지관" },
      { key: "badge", label: "봉사 시간", placeholder: "예) 12시간" },
      { key: "date_label", label: "기간", placeholder: "예) 2026.01 ~ 2026.02" },
      {
        key: "description",
        label: "설명",
        placeholder: "어떤 봉사를 했고 느낀 점",
        help: "어떤 봉사를 했고 느낀 점을 적어 주세요.",
      },
      { key: "image", label: "사진", help: "활동 사진" },
    ],
  },
  interests: {
    key: "interests",
    accent: "coral",
    icon: Heart,
    layout: "list2",
    emptyText: "나를 더 잘 보여 주는 관심사와 취미를 추가해 보세요.",
    fields: [
      { key: "title", label: "관심사/취미", required: true, placeholder: "예) 농구, 데이터 시각화, 밴드 합주" },
      {
        key: "description",
        label: "설명",
        placeholder: "왜 좋아하는지, 요즘 무엇을 하고 있는지",
        help: "왜 좋아하는지, 요즘 무엇을 하고 있는지 적어 주세요.",
      },
      { key: "image", label: "사진", help: "관련 사진(선택)" },
    ],
  },
};

export const FALLBACK_ICON = Award;

/** Hero/profile form fields (PLAN.md §7-1). */
export const PROFILE_FIELDS = {
  name: { label: "이름", required: true, placeholder: "예) 박지유" },
  age_label: {
    label: "나이·학년",
    placeholder: "예) 15세 · 또는 ○○고 1학년",
    help: "학교 이름은 넣지 않는 걸 추천해요.",
  },
  keywords: {
    label: "나를 나타내는 키워드",
    placeholder: "예) 도전, 끈기",
    help: "키워드를 입력하고 Enter. 2~4개가 가장 보기 좋아요.",
  },
  tagline: {
    label: "한 줄 소개 문구",
    placeholder: "예) 데이터로 문제를 찾고, 끝까지 해결하는 학생입니다.",
    help: "나를 한 문장으로 소개해요. 20~35자가 적당해요.",
  },
  intro_en: {
    label: "영문 자기소개",
    placeholder: "예) Hi, I'm Jiyu Park, a student who loves solving real problems with data…",
    help: "영어 3~4문장: ① 나는 누구인지 ② 관심 분야 ③ 해 본 일 ④ 앞으로 하고 싶은 일.",
  },
  photo: {
    label: "프로필 사진",
    help: "얼굴이 잘 보이는 밝은 사진 1장. 정사각형에 가까울수록 예뻐요. (선택)",
  },
  links: {
    label: "연락 링크",
    help: "이메일, 블로그, GitHub 등. 전화번호·주소는 넣지 마세요. (선택)",
  },
  allow_indexing: {
    label: "검색엔진 노출",
    help: "켜면 구글·네이버 검색에 나올 수 있어요. 기본은 꺼짐.",
  },
} as const;

/** Tailwind classes per accent. Text uses darker "-ink" variants to keep WCAG AA. */
export const ACCENT_CLASSES: Record<
  Accent,
  { text: string; softBg: string; solidBg: string; border: string; badge: string }
> = {
  coral: {
    text: "text-coral-ink",
    softBg: "bg-coral/12",
    solidBg: "bg-coral",
    border: "border-coral",
    badge: "bg-coral/15 text-coral-ink",
  },
  primary: {
    text: "text-primary-ink",
    softBg: "bg-sky",
    solidBg: "bg-primary",
    border: "border-primary",
    badge: "bg-sky text-primary-ink",
  },
  mint: {
    text: "text-mint-ink",
    softBg: "bg-mint/12",
    solidBg: "bg-mint",
    border: "border-mint",
    badge: "bg-mint/15 text-mint-ink",
  },
  sun: {
    text: "text-sun-ink",
    softBg: "bg-sun/20",
    solidBg: "bg-sun",
    border: "border-sun",
    badge: "bg-sun/35 text-ink",
  },
};

/** Korean object particle: "대회명을", "관심사/취미를". */
export function withObjectParticle(word: string) {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return `${word}을(를)`;
  return (code - 0xac00) % 28 === 0 ? `${word}를` : `${word}을`;
}

export function requiredMessage(label: string) {
  return `${withObjectParticle(label)} 입력해 주세요.`;
}
