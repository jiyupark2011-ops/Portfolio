-- 박지유 포트폴리오 — 초기 스키마
-- Supabase Dashboard → SQL Editor에 전체를 붙여 넣고 한 번 실행하세요.

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

-- ===== Data API 권한 (추가) =====
-- 최근 Supabase 프로젝트는 새 테이블을 Data API(anon/authenticated 역할)에 자동 공개하지 않을 수 있어
-- 필요한 권한만 명시적으로 부여한다. 실제로 누가 무엇을 할 수 있는지는 위 RLS 정책이 최종 결정한다.
grant usage on schema public to anon, authenticated;
grant select on public.profile, public.sections, public.items to anon, authenticated;
grant update on public.profile, public.sections to authenticated;
grant insert, update, delete on public.items to authenticated;
grant select on public.admin_users to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
