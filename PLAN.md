# 박지유 포트폴리오 웹앱 — 구현 계획서 (PLAN.md)

> 이 문서는 Codex(코딩 에이전트)가 처음부터 끝까지 순서대로 구현하기 위한 계획서입니다.
> 각 단계(Milestone)를 끝낼 때마다 **완료 조건**을 모두 만족하는지 확인한 뒤 다음 단계로 넘어갑니다.

---

## 0. Codex에게 주는 지시 (먼저 읽기)

- 이 저장소의 `PLAN.md`를 **Milestone 1 → 8 순서대로** 구현한다.
- 각 Milestone이 끝나면 `npm run build`와 `npm run lint`가 에러 없이 통과해야 한다.
- 불확실한 부분은 이 문서의 결정을 따르고, 문서에 없는 결정은 "가장 단순한 방법"을 택한 뒤 `NOTES.md`에 기록한다.
- **Supabase secret key(service_role)는 절대 사용하지 않는다.** 모든 권한은 RLS(Row Level Security)로 통제한다.
- 사용자에게 보이는 모든 UI 문구는 **한국어**, 코드·변수명·커밋 메시지는 영어.
- 라이브러리는 아래 "기술 스택"에 적힌 것만 사용한다. 추가가 꼭 필요하면 `NOTES.md`에 이유를 남긴다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 목적 | 고등학생 박지유의 개인 포트폴리오 웹앱 |
| 사용자 | ① 방문자(읽기 전용) ② 관리자 1명(박지유 본인, 편집 가능) |
| 핵심 | 공개 화면 / 편집 화면 분리, 사이트 안에서 바로 글·활동·사진 추가·수정·삭제, 수정 내용 DB에 영구 저장 |
| 기기 | 모바일 우선(360px~) + 태블릿 + 데스크톱 |
| 형태 | 웹앱(PWA: 홈 화면에 추가 가능) |

### 화면 구성 (한 페이지 스크롤)
1. **Hero(첫 화면)** — 이름·나이(`박지유 | 15세`), 키워드 칩(`도전 · 끈기`), 한 줄 소개 문구, 영문 자기소개, 프로필 사진(선택)
2. **수상 경력** (AWARDS)
3. **자격증** (CERTIFICATES)
4. **보유 기술** (SKILLS)
5. **작품** (PROJECTS)
6. **동아리 활동** (CLUBS)
7. **봉사활동** (VOLUNTEER)
8. **관심사 · 취미** (INTERESTS)
9. **Footer** — 연락 링크(선택), © 연도

섹션 순서·제목·숨김 여부는 관리자 화면에서 바꿀 수 있다.

---

## 2. 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | **Next.js 최신 안정 버전 (App Router) + TypeScript** |
| 스타일 | **Tailwind CSS (최신 버전)** |
| DB / 인증 / 파일 | **Supabase** (Postgres + Auth + Storage) |
| Supabase 클라이언트 | `@supabase/supabase-js`, `@supabase/ssr` |
| 이미지 압축 | `browser-image-compression` (업로드 전 브라우저에서 압축) |
| 아이콘 | `lucide-react` |
| 폰트 | Pretendard (CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css`) |
| 배포 | Vercel |

> 참고: Next.js 16 이상에서는 `middleware.ts` 대신 **`proxy.ts`** 를 사용한다. 설치된 버전에 맞는 파일명을 쓴다.

---

## 3. 환경 변수

`.env.local` (Git에 커밋하지 않음, `.gitignore`에 포함 확인)

```env
NEXT_PUBLIC_SUPABASE_URL=https://rmezcmysoqtistndvwwi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_lSz9OIgyDvQEjmBzN8PLCA_IXeGEIvx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `.env.example`에는 값 없이 키 이름만 적어 커밋한다.
- publishable key는 브라우저에 노출되어도 되는 공개 키다. 보안은 RLS가 담당한다.
- Vercel 배포 시 같은 3개 변수를 Project Settings → Environment Variables에 등록하고, `NEXT_PUBLIC_SITE_URL`은 실제 도메인으로 바꾼다.

---

## 4. 폴더 구조 (목표)

```
/
├─ app/
│  ├─ layout.tsx                 # 폰트, 메타데이터, 공통 레이아웃
│  ├─ page.tsx                   # 공개 화면 (Server Component)
│  ├─ manifest.ts                # PWA manifest
│  ├─ globals.css                # 색상 토큰, Tailwind
│  ├─ admin/
│  │  ├─ login/page.tsx          # 관리자 로그인
│  │  ├─ layout.tsx              # 관리자 권한 확인 (is_admin)
│  │  ├─ page.tsx                # 편집 화면
│  │  └─ actions.ts              # Server Actions (CRUD, revalidatePath)
│  └─ auth/signout/route.ts      # 로그아웃
├─ components/
│  ├─ public/                    # Hero, SectionNav, Section, ItemCard 등 (읽기 전용)
│  ├─ admin/                     # AdminToolbar, EditSheet, ItemForm, ProfileForm, ImageUploader, ConfirmDialog, Toast
│  └─ ui/                        # Button, Chip, Card, Input, Textarea 등 공통
├─ lib/
│  ├─ supabase/client.ts         # createBrowserClient
│  ├─ supabase/server.ts         # createServerClient (cookies)
│  ├─ supabase/proxy.ts          # 세션 갱신 헬퍼 (middleware/proxy용)
│  ├─ data.ts                    # getProfile, getSections, getItems
│  ├─ sections.ts                # 섹션별 필드 구성 + 안내 문구 (아래 7장)
│  ├─ image.ts                   # 압축, 경로 생성, public URL 변환
│  └─ types.ts                   # DB 타입
├─ proxy.ts (또는 middleware.ts) # /admin 보호
├─ supabase/
│  ├─ migrations/001_init.sql    # 5장 SQL
│  └─ seed.sql                   # 6장 SQL
├─ public/icons/                 # PWA 아이콘 192, 512, maskable
├─ NOTES.md
└─ README.md                     # 설치·관리자 계정 만들기·배포 방법
```

---

## 5. 데이터베이스 설계 (`supabase/migrations/001_init.sql`)

> Supabase Dashboard → SQL Editor에서 그대로 실행한다. README에도 이 절차를 적는다.

```sql
-- ===== 확장 =====
create extension if not exists pgcrypto;

-- ===== 관리자 목록 =====
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ===== updated_at 자동 갱신 =====
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===== 프로필 (항상 1행) =====
create table if not exists public.profile (
  id             smallint primary key default 1 check (id = 1),
  name           text not null default '',
  age_label      text not null default '',          -- 예: '15세'
  tagline        text not null default '',          -- 한 줄 소개 문구
  keywords       text[] not null default '{}',      -- 예: {'도전','끈기'}
  intro_en       text not null default '',          -- 영문 자기소개
  photo_path     text,                              -- Storage 경로
  links          jsonb not null default '[]'::jsonb,-- [{ "label": "Email", "url": "mailto:..." }]
  allow_indexing boolean not null default false,    -- 검색엔진 노출 여부 (기본: 노출 안 함)
  updated_at     timestamptz not null default now()
);
create trigger profile_updated_at before update on public.profile
  for each row execute function public.set_updated_at();

-- ===== 섹션 =====
create table if not exists public.sections (
  key        text primary key
             check (key in ('awards','certificates','skills','works','clubs','volunteer','interests')),
  eyebrow    text not null default '',   -- 영문 작은 제목 예: 'AWARDS'
  title      text not null,              -- 한글 제목 예: '수상 경력'
  subtitle   text not null default '',   -- 섹션 설명 한 줄 (선택)
  sort_order int  not null default 0,
  is_visible boolean not null default true
);

-- ===== 항목 (모든 섹션 공통) =====
create table if not exists public.items (
  id           uuid primary key default gen_random_uuid(),
  section_key  text not null references public.sections(key) on delete cascade,
  title        text not null default '',
  badge        text not null default '',  -- 수상등급 / 급수 / 역할 / 분류 / 봉사시간 등
  organization text not null default '',  -- 주최·발급기관·장소
  date_label   text not null default '',  -- 자유 입력 예: '2026.07' / '2025.03 ~ 현재'
  description  text not null default '',
  level        smallint check (level between 1 and 5), -- 보유 기술 숙련도
  tags         text[] not null default '{}',           -- 작품 사용 도구 등
  image_path   text,
  link_url     text,
  sort_order   int not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists items_section_sort_idx on public.items (section_key, sort_order);
create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

-- ===== RLS =====
alter table public.admin_users enable row level security;
alter table public.profile     enable row level security;
alter table public.sections    enable row level security;
alter table public.items       enable row level security;

-- admin_users: 본인 행만 조회 가능, 쓰기 정책 없음(= SQL Editor에서만 추가)
create policy "admin_users self read" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- profile
create policy "profile public read" on public.profile
  for select using (true);
create policy "profile admin update" on public.profile
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- sections
create policy "sections public read" on public.sections
  for select using (is_visible or public.is_admin());
create policy "sections admin update" on public.sections
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- items
create policy "items public read" on public.items
  for select using (is_visible or public.is_admin());
create policy "items admin insert" on public.items
  for insert to authenticated with check (public.is_admin());
create policy "items admin update" on public.items
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "items admin delete" on public.items
  for delete to authenticated using (public.is_admin());

-- ===== Storage =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

-- 공개 버킷이라 이미지 보기는 public URL로 누구나 가능.
-- 업로드/교체/삭제는 관리자만.
create policy "portfolio admin select" on storage.objects
  for select to authenticated using (bucket_id = 'portfolio' and public.is_admin());
create policy "portfolio admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio' and public.is_admin());
create policy "portfolio admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio' and public.is_admin())
  with check (bucket_id = 'portfolio' and public.is_admin());
create policy "portfolio admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio' and public.is_admin());
```

---

## 6. 초기 데이터 (`supabase/seed.sql`)

> 사용자가 직접 정한 문구만 넣는다. 나머지 칸은 **비워 두고**, 편집 화면에서 안내 문구(7장)가 보이게 한다.
> 여러 번 실행해도 중복되지 않게 작성한다.

```sql
insert into public.profile (id, name, age_label, keywords)
values (1, '박지유', '15세', array['도전','끈기'])
on conflict (id) do nothing;

insert into public.sections (key, eyebrow, title, sort_order) values
  ('awards',       'AWARDS',       '수상 경력',     10),
  ('certificates', 'CERTIFICATES', '자격증',        20),
  ('skills',       'SKILLS',       '보유 기술',     30),
  ('works',        'PROJECTS',     '작품',          40),
  ('clubs',        'CLUBS',        '동아리 활동',   50),
  ('volunteer',    'VOLUNTEER',    '봉사활동',      60),
  ('interests',    'INTERESTS',    '관심사 · 취미', 70)
on conflict (key) do nothing;

insert into public.items (section_key, title, badge, sort_order)
select v.section_key, v.title, v.badge, v.sort_order
from (values
  ('awards',       '제3회 학교안전사고 데이터 분석 활용 경진대회',               '대상',      10),
  ('awards',       '2026 SONGDO 3s',                                              '3rd place', 20),
  ('awards',       '2026 Little Ambassador 선발 공모전',                          '최우수상',  30),
  ('awards',       '2026 제8회 전국 학생 AI 경진대회 · 교과연계 AI 탐구 부문',    '장려상',    40),
  ('certificates', '한자능력검정시험',                                            '5급',       10),
  ('clubs',        'g2f',                                                         '',          10),
  ('clubs',        '농구부',                                                      '',          20),
  ('clubs',        '밴드',                                                        '',          30),
  ('volunteer',    'g2f',                                                         '',          10)
) as v(section_key, title, badge, sort_order)
where not exists (select 1 from public.items);
```

보유 기술 · 작품 · 관심사 · 취미는 항목 0개로 시작한다(편집 화면에 안내 카드 표시).

---

## 7. 섹션별 입력 칸 & 안내 문구 (`lib/sections.ts`)

안내 문구는 **DB가 아니라 코드에** 둔다. 편집 화면 입력칸의 `placeholder`와 도움말(입력칸 아래 회색 작은 글씨)로 사용한다.
섹션마다 아래 표에 있는 칸만 폼에 보여 준다. `필수`는 저장 시 비어 있으면 안 되는 칸.

### 7-1. Hero (profile)

| 칸 | 라벨 | 안내 문구(placeholder / 도움말) |
|---|---|---|
| name | 이름 (필수) | 예) 박지유 |
| age_label | 나이·학년 | 예) 15세 · 또는 ○○고 1학년 (학교 이름은 넣지 않는 걸 추천해요) |
| keywords | 나를 나타내는 키워드 | 키워드를 입력하고 Enter. 2~4개가 가장 보기 좋아요. 예) 도전, 끈기 |
| tagline | 한 줄 소개 문구 | 나를 한 문장으로 소개해요. 20~35자가 적당해요. 예) 데이터로 문제를 찾고, 끝까지 해결하는 학생입니다. |
| intro_en | 영문 자기소개 | 영어 3~4문장: ① 나는 누구인지 ② 관심 분야 ③ 해 본 일 ④ 앞으로 하고 싶은 일. 예) Hi, I'm Jiyu Park, a student who loves solving real problems with data… |
| photo_path | 프로필 사진 | 얼굴이 잘 보이는 밝은 사진 1장. 정사각형에 가까울수록 예뻐요. (선택) |
| links | 연락 링크 | 이메일, 블로그, GitHub 등. 전화번호·주소는 넣지 마세요. (선택) |
| allow_indexing | 검색엔진 노출 | 켜면 구글·네이버 검색에 나올 수 있어요. 기본은 꺼짐. |

### 7-2. 항목 섹션

| 섹션 | 사용하는 칸 | 칸별 라벨 → 안내 문구 |
|---|---|---|
| **수상 경력** awards | title(필수), badge, organization, date_label, description, image, link | 대회명 → 예) 제3회 학교안전사고 데이터 분석 활용 경진대회 · 수상 등급 → 예) 대상, 최우수상, 3rd place · 주최 기관 → 예) 교육부, ○○시 · 날짜 → 예) 2026.07 · 설명 → 무엇을 만들었는지, 내 역할, 배운 점을 2~3문장으로 · 사진 → 상장이나 발표 사진 · 링크 → 관련 기사나 결과물 주소(선택) |
| **자격증** certificates | title(필수), badge, organization, date_label, image | 자격증명 → 예) 한자능력검정시험 · 급수/점수 → 예) 5급 · 발급 기관 → 예) 한국어문회 · 취득일 → 예) 2025.11 · 사진 → 자격증 사진(개인정보 가리기) |
| **보유 기술** skills | title(필수), badge, level, description | 기술명 → 예) Python, 영상 편집, 드럼 · 분류 → 예) 코딩 / 디자인 / 언어 / 악기 · 숙련도 → 1(입문)~5(능숙) 별 선택 · 설명 → 이 기술을 어디에 써 봤는지 한 줄로. 예) 데이터 분석 대회에서 pandas로 사고 데이터를 정리했어요. |
| **작품** works | title(필수), date_label, description, tags, image, link | 작품 이름 → 예) 학교 안전사고 데이터 대시보드 · 제작 기간 → 예) 2026.04 ~ 2026.06 · 설명 → 왜 만들었는지, 어떻게 만들었는지, 결과는 어땠는지 · 사용 도구 → Enter로 추가. 예) Python, Figma · 대표 이미지 → 작품 화면이나 결과물 사진 · 링크 → 작품 주소나 영상 링크(선택) |
| **동아리 활동** clubs | title(필수), badge, date_label, description, image | 동아리명 → 예) 농구부 · 역할 → 예) 부원, 부장, 보컬 · 활동 기간 → 예) 2025.03 ~ 현재 · 설명 → 어떤 활동을 했고 무엇을 배웠는지 · 사진 → 활동 사진(다른 친구 얼굴은 동의 받고) |
| **봉사활동** volunteer | title(필수), organization, badge, date_label, description, image | 활동명 → 예) g2f 봉사 · 기관/장소 → 예) ○○복지관 · 봉사 시간 → 예) 12시간 · 기간 → 예) 2026.01 ~ 2026.02 · 설명 → 어떤 봉사를 했고 느낀 점 · 사진 → 활동 사진 |
| **관심사 · 취미** interests | title(필수), description, image | 관심사/취미 → 예) 농구, 데이터 시각화, 밴드 합주 · 설명 → 왜 좋아하는지, 요즘 무엇을 하고 있는지 · 사진 → 관련 사진(선택) |

### 7-3. 빈 섹션 안내 카드 (편집 화면 전용)

항목이 0개인 섹션에는 점선 테두리 카드를 보여 준다:
- 보유 기술: "내가 할 줄 아는 것을 추가해 보세요. 코딩, 디자인, 외국어, 악기 등 무엇이든 좋아요."
- 작품: "직접 만든 결과물을 추가해 보세요. 대회 출품작, 수행평가, 개인 프로젝트 모두 좋아요."
- 관심사 · 취미: "나를 더 잘 보여 주는 관심사와 취미를 추가해 보세요."
- (공통 형식) "+ 첫 항목 추가" 버튼 포함

### 7-4. 공개 화면에서 빈 값 처리

- 빈 칸(설명, 기관, 날짜 등)은 **공개 화면에 표시하지 않는다**(라벨만 덩그러니 남지 않게).
- 보이는 항목이 0개인 섹션은 공개 화면과 상단 내비게이션에서 **숨긴다**.
- tagline / intro_en이 비어 있으면 Hero에서 해당 줄을 숨긴다.
- 안내 문구는 공개 화면에 **절대** 노출하지 않는다.

---

## 8. 디자인 가이드

### 8-1. 방향
"밝고 친근한 학생다움" + "정돈된 전문성".
- 밝음: 크림색 배경, 노랑·코랄·민트 포인트, 둥근 카드, 키워드 아래 형광펜 밑줄
- 전문성: 진한 네이비 본문, 넉넉한 여백, 일정한 격자, 섹션마다 영문 eyebrow + 한글 제목의 일관된 구조, 과한 장식 없음

### 8-2. 색상 토큰 (`globals.css`의 CSS 변수 → Tailwind 테마로 연결)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | `#FFFBF2` | 페이지 배경(따뜻한 크림) |
| `--surface` | `#FFFFFF` | 카드 배경 |
| `--ink` | `#1B2440` | 본문·제목(딥 네이비) |
| `--ink-soft` | `#5B6478` | 보조 텍스트 |
| `--line` | `#ECE6D9` | 테두리·구분선 |
| `--primary` | `#2F5BEA` | 주요 버튼·링크(신뢰감 있는 블루) |
| `--sun` | `#FFC93C` | 형광펜 밑줄, 배지 배경 (텍스트 색으로 쓰지 않음) |
| `--coral` | `#FF6F59` | 수상 배지, 강조 포인트 |
| `--mint` | `#2BB6A3` | 기술·봉사 포인트 |
| `--sky` | `#E8F0FF` | 연한 블루 배경 칩 |

- 섹션마다 포인트 색을 순환: 수상=coral, 자격증=primary, 기술=mint, 작품=primary, 동아리=sun, 봉사=mint, 관심사=coral (아이콘 원형 배경·배지에 사용)
- 모든 텍스트/배경 조합은 WCAG AA(4.5:1) 이상. 노랑 위 글자는 `--ink` 사용.

### 8-3. 타이포그래피
- 폰트: Pretendard Variable (한글·영문 모두)
- Hero 이름: 모바일 40px / 데스크톱 64px, weight 800
- 섹션 eyebrow: 12–13px, 대문자, letter-spacing 0.12em, 포인트 색
- 섹션 제목: 모바일 26px / 데스크톱 34px, weight 700
- 본문: 16px, line-height 1.7, `word-break: keep-all` (한글 단어 중간 줄바꿈 방지)
- 영문 자기소개: 17–18px, 인용문처럼 왼쪽에 포인트 색 세로선

### 8-4. 레이아웃 & 컴포넌트
- 최대 폭 1080px, 좌우 패딩 모바일 20px / 데스크톱 32px
- Hero: `min-height: 100svh`(모바일 주소창 고려), 가운데 정렬 → 데스크톱은 좌측 텍스트 + 우측 원형 프로필 사진
- 키워드 칩: `도전 · 끈기` 를 둥근 칩으로, 아래에 노란 형광펜 효과
- 상단 내비게이션: 스크롤 시 고정, 모바일은 섹션 이름 칩을 **가로 스크롤**, 현재 섹션 하이라이트
- 카드: radius 20px, 1px `--line` 테두리, 아주 옅은 그림자, hover 시 살짝 떠오름(데스크톱만)
- 수상 카드: 왼쪽 트로피 아이콘 + 오른쪽 상단 badge(대상/최우수상 등) 강조
- 보유 기술: 별 5개 또는 점 5개로 level 표시 + 분류별 칩
- 작품: 이미지 우선 카드(16:10 비율), 모바일 1열 / md 2열 / lg 3열
- 자격증·동아리·봉사·관심사: 모바일 1열 / md 2열
- 이미지는 `next/image` 사용, `remotePatterns`에 Supabase 도메인 등록, 이미지 없을 때는 섹션 포인트 색의 연한 배경 + 아이콘
- 애니메이션: 스크롤 시 부드러운 fade-up(짧게). `prefers-reduced-motion`이면 끔.

### 8-5. 모바일 체크
- 360px 폭에서 가로 스크롤 생기지 않음
- 터치 대상 최소 44×44px
- 폼 입력 글자 16px 이상(iOS 확대 방지)
- 편집 폼은 모바일에서 **바텀 시트**, 데스크톱에서 **모달**

---

## 9. 공개 화면 / 편집 화면 분리 & 인증

### 9-1. 라우트

| 경로 | 누가 | 설명 |
|---|---|---|
| `/` | 모두 | 공개 화면(읽기 전용). 편집 버튼 전혀 없음 |
| `/admin/login` | 모두 | 이메일+비밀번호 로그인 폼 |
| `/admin` | 관리자만 | 편집 화면 |

- 공개 화면에는 관리자 링크를 노출하지 않는다(주소를 아는 본인만 접근). Footer의 © 글자를 길게 누르면 이동하는 숨은 링크 정도는 허용.

### 9-2. 관리자 계정 (README에 사용자가 할 일로 안내)
1. Supabase Dashboard → Authentication → Sign In / Providers → **"Allow new users to sign up" 끄기**
2. Authentication → Users → **Add user** → 이메일·비밀번호 입력, **Auto Confirm User 체크**
3. SQL Editor에서 실행:
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
   on conflict do nothing;
   ```

### 9-3. 보호 방식 (3중)
1. **proxy.ts / middleware.ts**: `@supabase/ssr` 공식 패턴으로 세션 쿠키 갱신. `/admin`(login 제외)에 로그인 안 된 상태로 오면 `/admin/login`으로 redirect.
2. **app/admin/layout.tsx (Server Component)**: `supabase.rpc('is_admin')`가 false면 로그아웃 후 `/admin/login?error=forbidden`으로 redirect.
3. **RLS**: 실제 데이터 쓰기 권한은 DB가 최종 판단(위 SQL). 1·2가 뚫려도 쓰기 불가.

### 9-4. 로그인 화면
- 이메일, 비밀번호, "로그인" 버튼, 비밀번호 보기 토글
- 실패 시: "이메일 또는 비밀번호가 맞지 않아요."
- 성공 후 `is_admin` 확인 → `/admin` 이동
- 로그인 상태 유지(Supabase 세션 쿠키)

---

## 10. 편집 화면 기능 상세 (`/admin`)

편집 화면은 **공개 화면과 같은 레이아웃**을 쓰되, 아래 편집 도구가 추가된다.

### 10-1. 상단 고정 관리자 바
- 왼쪽: "편집 모드" 라벨(노란 배경)
- 오른쪽: `공개 화면 보기`(새 탭으로 `/`), `로그아웃`
- 모바일에서도 한 줄로 보이게 아이콘+짧은 글자

### 10-2. Hero 편집
- Hero 영역 우측 상단 `✏️ 수정` → 프로필 폼(7-1의 모든 칸)
- 키워드: 칩 입력(Enter로 추가, X로 삭제)
- 링크: 행 추가/삭제(라벨 + URL)
- 프로필 사진: 업로드 / 교체 / 삭제

### 10-3. 섹션 편집
- 섹션 제목 옆 `⚙️` → eyebrow, 제목, 설명 한 줄, 공개/숨김 토글
- 섹션 순서: `↑ / ↓` 버튼 (드래그 대신 — 모바일에서 확실하게 동작)
- 섹션 하단 `+ 항목 추가` 버튼

### 10-4. 항목 편집 (각 카드)
- 카드 우측 상단 도구: `✏️ 수정`, `👁 공개/숨김`, `↑`, `↓`, `🗑 삭제`
- 숨김 항목은 편집 화면에서 반투명 + "숨김" 라벨, 공개 화면에는 안 보임
- 수정/추가 폼: 섹션별로 7-2 표의 칸만 표시, 안내 문구는 placeholder와 도움말로
- 필수 칸 비면 저장 버튼 비활성 + "○○을 입력해 주세요."
- 삭제: 직접 만든 확인 모달("이 항목을 삭제할까요? 사진도 함께 삭제돼요." — `window.confirm` 사용 금지)
- 순서 변경 시 해당 섹션 항목들의 `sort_order`를 10, 20, 30… 으로 다시 매김

### 10-5. 저장 & 반영
- 모든 쓰기는 **Server Actions**(`app/admin/actions.ts`)에서 서버용 Supabase 클라이언트(사용자 쿠키 세션)로 실행 → RLS 적용
- 각 action 시작 시 `is_admin` 재확인, 입력값 검증(길이 제한: title 100자, badge 30자, description 1000자, intro_en 1500자, URL은 http/https/mailto만)
- 성공 후 `revalidatePath('/')`, `revalidatePath('/admin')` → 공개 화면에 즉시 반영
- 공개 화면 `page.tsx`는 `export const revalidate = 60` (안전망)
- 저장 결과는 토스트로: "저장했어요" / "저장에 실패했어요. 다시 시도해 주세요."
- 폼에 수정 중인 내용이 있는데 닫으려 하면 "저장하지 않은 내용이 있어요. 닫을까요?" 확인

### 10-6. 사진 업로드 / 교체 / 삭제 (`components/admin/ImageUploader.tsx`)
- 버튼: `사진 선택`(모바일에서 카메라/앨범 선택 가능하도록 `accept="image/*"`)
- 업로드 전 브라우저에서 압축: 최대 1600px, WebP, 목표 1MB 이하 (`browser-image-compression`)
- 업로드는 **브라우저 Supabase 클라이언트로 Storage에 직접**(Server Action 본문 크기 제한 회피)
- 경로 규칙: `profile/{uuid}.webp`, `items/{section_key}/{uuid}.webp` (매번 새 파일명 → 캐시 문제 없음)
- 업로드 성공 → Server Action으로 DB의 `image_path`/`photo_path` 업데이트 → 그 다음 **이전 파일 삭제**
- 항목 삭제 시 연결된 이미지 파일도 Storage에서 삭제
- 업로드 중 진행 표시(스피너 + "사진 올리는 중…"), 실패 시 에러 토스트
- 미리보기: 선택 즉시 썸네일 표시, `교체`, `삭제` 버튼
- 허용 형식 외 / 5MB 초과(압축 후에도) 시 안내: "JPG, PNG, WebP 사진만 올릴 수 있어요."

---

## 11. 데이터 읽기 (`lib/data.ts`)

- `getProfile()`: profile 1행
- `getSections()`: `order by sort_order`
- `getItems()`: 전체 items `order by section_key, sort_order`, 섹션별로 그룹핑
- 공개 화면: anon 권한 → RLS가 숨김 항목 자동 제외
- 편집 화면: 관리자 세션 → 숨김 항목 포함
- 이미지 URL: `supabase.storage.from('portfolio').getPublicUrl(path)` 를 감싸는 `toPublicUrl(path)` 헬퍼

---

## 12. 웹앱(PWA) & SEO

- `app/manifest.ts`: name "박지유 포트폴리오", short_name "Jiyu", display "standalone", background `#FFFBF2`, theme `#1B2440`, 아이콘 192/512/maskable
- 아이콘: 네이비 원 위 노란 "J" 이니셜로 간단히 생성(SVG → PNG)
- `<meta name="theme-color">`, Apple touch icon
- 메타데이터: title `박지유 | Portfolio`, description = tagline(없으면 기본 문구), OG 이미지(프로필 사진 또는 기본 이미지)
- `allow_indexing`이 false면 `robots: { index: false, follow: false }`, `/admin`은 항상 noindex
- 서비스 워커/오프라인 캐시는 **이번 범위에서 제외**(복잡도 대비 효과 낮음)

---

## 13. 구현 순서 (Milestones)

### Milestone 1 — 프로젝트 생성
- `create-next-app` (TypeScript, Tailwind, App Router, ESLint, `src/` 없이)
- Pretendard, 색상 토큰, 공통 UI(Button, Card, Chip, Input, Textarea)
- `.env.local`, `.env.example`, `.gitignore` 확인
- **완료 조건**: 빈 페이지가 크림 배경 + Pretendard로 뜨고 build/lint 통과

### Milestone 2 — DB 준비
- `supabase/migrations/001_init.sql`, `supabase/seed.sql` 파일 작성(5·6장 그대로)
- `lib/types.ts`, `lib/supabase/*`, `lib/data.ts`
- README에 "SQL Editor에서 001_init.sql → seed.sql 순서로 실행" 안내
- **완료 조건**: 로컬에서 `getProfile()` 결과로 "박지유"가 화면에 찍힘

### Milestone 3 — 공개 화면
- Hero, 섹션 내비게이션, 섹션별 카드 컴포넌트, Footer
- 7-4의 빈 값 처리 규칙
- 반응형(360 / 768 / 1280px)
- **완료 조건**: 시드 데이터(수상 4, 자격증 1, 동아리 3, 봉사 1)가 보이고, 항목 없는 섹션(기술·작품·관심사)은 숨겨짐. 360px에서 가로 스크롤 없음.

### Milestone 4 — 인증 & 보호
- proxy/middleware, `/admin/login`, `app/admin/layout.tsx`의 is_admin 확인, 로그아웃
- **완료 조건**: 로그아웃 상태로 `/admin` 접속 → 로그인으로 이동. 관리자 아닌 계정 → 거부. 관리자 → 편집 화면 진입.

### Milestone 5 — 텍스트 편집
- 관리자 바, Hero 편집, 섹션 설정, 항목 추가/수정/삭제/숨김/순서 변경
- 7장 안내 문구 적용, 빈 섹션 안내 카드
- Server Actions + revalidatePath + 토스트
- **완료 조건**: 편집 후 새로고침해도 유지, 다른 브라우저(로그아웃 상태)의 `/`에서도 즉시 반영. 숨김 항목은 공개 화면에 안 보임.

### Milestone 6 — 사진
- ImageUploader(압축, 업로드, 교체, 삭제, 이전 파일 정리)
- 프로필 사진, 항목 사진 적용
- **완료 조건**: 휴대폰으로 찍은 사진(4~10MB)도 업로드되고 1MB 안팎으로 저장. 교체 후 Storage에 이전 파일이 남지 않음.

### Milestone 7 — 웹앱 & 마무리
- manifest, 아이콘, 메타데이터, robots, 스크롤 애니메이션, 접근성(alt, label, focus ring)
- **완료 조건**: Lighthouse 모바일 Performance ≥ 85, Accessibility ≥ 95. 휴대폰 "홈 화면에 추가" 가능.

### Milestone 8 — 점검 & 배포
- 14장 체크리스트 전체 수행, 결과를 `NOTES.md`에 기록
- README에 Vercel 배포 방법(저장소 연결 → 환경변수 3개 → Deploy) 정리
- **완료 조건**: 체크리스트 전부 통과

---

## 14. 최종 점검 체크리스트

**공개 화면**
- [ ] 첫 화면에 `박지유 | 15세`, `도전 · 끈기` 칩이 보인다
- [ ] 한 줄 소개·영문 소개가 비어 있으면 해당 줄이 숨겨진다
- [ ] 안내 문구가 공개 화면 어디에도 보이지 않는다
- [ ] 편집 버튼·관리자 링크가 공개 화면에 보이지 않는다
- [ ] iPhone SE(375px), Galaxy(360px), iPad, 데스크톱에서 깨지지 않는다
- [ ] 한글이 단어 중간에서 줄바꿈되지 않는다

**편집 화면**
- [ ] 로그인 없이 `/admin` 접근 불가
- [ ] 관리자 아닌 계정으로 로그인해도 편집 불가
- [ ] 브라우저 콘솔에서 anon/일반 계정으로 `items` insert/update/delete 시도 → RLS로 거부됨
- [ ] Hero 텍스트·키워드·사진 수정 → 새로고침 후 유지
- [ ] 7개 섹션 모두 항목 추가·수정·삭제·숨김·순서 변경 동작
- [ ] 섹션 제목 변경·숨김·순서 변경 동작
- [ ] 사진 업로드·교체·삭제 동작, 이전 파일 Storage에서 정리됨
- [ ] 저장하지 않고 닫으면 확인 창이 뜬다
- [ ] 모바일에서 바텀 시트 폼으로 모든 편집 가능

**보안·개인정보**
- [ ] 코드 어디에도 service_role / secret key 없음
- [ ] `.env.local`이 Git에 올라가지 않음
- [ ] Supabase에서 회원가입(sign up) 꺼짐
- [ ] `allow_indexing` 기본 false → `noindex` 메타 확인

---

## 15. 범위 밖 (이번에 하지 않음)

- 다국어 전환(한/영 토글) — 영문 자기소개만 영어
- 작품 1개당 여러 장 갤러리 (추후 `item_images` 테이블로 확장 가능)
- 방문자 댓글·방명록, 방문 통계
- 오프라인 모드(서비스 워커)
- 관리자 여러 명, 비밀번호 찾기 화면(필요 시 Supabase Dashboard에서 재설정)
