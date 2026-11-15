# 박지유 포트폴리오

고등학생 박지유의 개인 포트폴리오 웹앱입니다.

- **공개 화면** `/`: 누구나 볼 수 있는 읽기 전용 화면
- **편집 화면** `/admin`: 관리자(본인)만 로그인해서 글·활동·사진을 추가·수정·삭제
- 휴대폰 "홈 화면에 추가"로 앱처럼 쓸 수 있어요 (PWA)

기술 스택: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (DB·로그인·사진 저장) · Vercel

---

## 1. 내 컴퓨터에서 실행하기

필요한 것: [Node.js](https://nodejs.org) 20 이상

```bash
npm install
```

프로젝트 폴더에 `.env.local` 파일을 만들고 아래 3줄을 넣습니다. (`.env.example` 참고)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> publishable key는 공개돼도 되는 키예요. **secret key(service_role)는 이 프로젝트 어디에도 넣지 마세요.**
> `.env.local`은 Git에 올라가지 않아요.

```bash
npm run dev      # 개발 서버 → http://localhost:3000
npm run build    # 배포용 빌드
npm run lint     # 코드 검사
```

---

## 2. Supabase 준비 (처음 한 번)

### 2-1. 테이블·권한·사진 저장소 만들기

1. [Supabase Dashboard](https://supabase.com/dashboard) → 내 프로젝트 → 왼쪽 메뉴 **SQL Editor**
2. **New query** → `supabase/migrations/001_init.sql` 내용을 전부 붙여 넣고 **Run**
3. 다시 **New query** → `supabase/seed.sql` 내용을 붙여 넣고 **Run**

반드시 **001_init.sql → seed.sql** 순서로 실행하세요.
`001_init.sql`은 한 번만 실행합니다(두 번 실행하면 "already exists" 오류가 나요 — 이미 만들어졌다는 뜻이라 괜찮아요).
`seed.sql`은 여러 번 실행해도 중복되지 않아요.

### 2-2. 관리자 계정 만들기

1. **Authentication → Sign In / Providers** → **"Allow new users to sign up" 끄기** (다른 사람이 가입하지 못하게)
2. **Authentication → Users → Add user → Create new user**
   이메일·비밀번호 입력, **Auto Confirm User** 체크 → 만들기
3. **SQL Editor**에서 아래를 실행 (이메일을 방금 만든 것으로 바꾸기):

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
   on conflict do nothing;
   ```

이제 `/admin/login`에서 그 이메일·비밀번호로 로그인하면 편집 화면이 열립니다.
비밀번호를 잊으면 Dashboard → Authentication → Users에서 다시 설정하세요.

---

## 3. 사용법

- 편집 화면 주소: `https://내-도메인/admin` (공개 화면에는 링크가 없어요. 화면 맨 아래 **©** 글자를 길게 누르면 이동해요)
- **프로필(첫 화면)**: 오른쪽 위 `수정`
- **섹션**: 제목 옆 `↑ ↓`로 순서 변경, `⚙` 로 제목·설명·공개/숨김
- **항목**: 카드 위 도구 줄 — `수정` · `공개/숨김` · `↑ ↓` · `삭제`
- 사진은 올리기 전에 휴대폰에서 자동으로 줄여서(최대 1600px, WebP, 약 1MB) 저장돼요.
- 저장하면 공개 화면에 바로 반영돼요.

---

## 4. Vercel에 배포하기

1. 이 프로젝트를 GitHub 저장소에 올립니다.
2. [Vercel](https://vercel.com) → **Add New… → Project** → 그 저장소 **Import**
3. **Environment Variables**에 3개 등록
   | 이름 | 값 |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key |
   | `NEXT_PUBLIC_SITE_URL` | 실제 주소 (예: `https://jiyu.vercel.app`) |
4. **Deploy**
5. 배포 후 주소가 정해지면 `NEXT_PUBLIC_SITE_URL`을 그 주소로 맞추고 **Redeploy** 하세요.
6. (선택) Supabase → Authentication → URL Configuration → **Site URL**을 배포 주소로 바꿔 두면 좋아요.

---

## 5. 폴더 구조

```
app/
  page.tsx                 공개 화면 (60초 캐시 + 저장 시 즉시 갱신)
  admin/login/page.tsx     로그인
  admin/(editor)/          편집 화면 (layout.tsx에서 관리자 확인)
  admin/actions.ts         저장·삭제 등 Server Actions
  auth/signout/route.ts    로그아웃
  manifest.ts, robots.ts   웹앱·검색엔진 설정
components/public|admin|ui 화면 조각
lib/                       Supabase 연결, 데이터 읽기, 섹션별 입력칸·안내 문구(sections.ts)
proxy.ts                   /admin 접근 보호 (로그인 안 하면 로그인 화면으로)
supabase/                  SQL (001_init.sql, seed.sql)
```

보안은 3단계로 지켜져요: ① `proxy.ts`(로그인 확인) ② 편집 화면 레이아웃(관리자 확인) ③ Supabase RLS(데이터베이스가 직접 쓰기 권한 확인).
