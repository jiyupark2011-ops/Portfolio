# NOTES — 구현 중 내린 결정 기록

PLAN.md에 없거나 설치된 버전과 맞지 않아 직접 정한 내용입니다.

## 프레임워크 / 캐싱
- **Next.js 16.4.5**: `middleware.ts` 대신 `proxy.ts` 사용 (PLAN 2장 참고 문구대로).
- `create-next-app` 기본값으로 켜지는 **Cache Components(`cacheComponents`, `partialPrefetching`)는 껐다.**
  켜면 `export const revalidate` route segment config를 쓸 수 없고 데이터 읽기마다 `use cache`/`Suspense` 설계가 필요하다.
  PLAN 10-5의 `revalidate = 60` + `revalidatePath` 모델을 그대로 쓰는 쪽이 가장 단순하다.
- 공개 화면은 **쿠키를 쓰지 않는 anon 클라이언트**(`createPublicClient`)로 읽는다 → 정적 생성 + 60초 ISR 가능.
  편집 화면은 쿠키 세션 클라이언트로 읽어 숨김 항목까지 받는다.
- `proxy.ts`의 matcher는 `/admin/*`, `/auth/*`만. 공개 화면 요청은 세션 처리를 거치지 않는다.
- `next/image`: Next 16에서 `priority`가 deprecated → `preload` 사용. `images.qualities: [75]` 명시.

## 라우트 구조
- 로그인 페이지까지 관리자 확인 레이아웃에 걸리지 않도록 route group 사용:
  - `app/admin/layout.tsx` → `/admin` 전체 noindex 메타데이터만
  - `app/admin/(editor)/layout.tsx` → 로그인·`is_admin` 확인 (PLAN의 `app/admin/layout.tsx` 역할)
  - `app/admin/login/page.tsx` → 로그인
- 관리자가 아닌 계정: Server Component는 쿠키를 지울 수 없어서 `/auth/signout?error=forbidden`(Route Handler)으로 보내 로그아웃 후 `/admin/login?error=forbidden`으로 이동.
  로그아웃 버튼은 같은 Route Handler에 POST.
- 로그인 직후에도 브라우저에서 `is_admin`을 확인해 관리자가 아니면 바로 로그아웃시키고 안내한다.

## DB / SQL
- `001_init.sql` 끝에 **Data API 권한(grant) 블록을 추가**했다. 최근 Supabase 프로젝트는 새 테이블을
  anon/authenticated 역할에 자동 공개하지 않을 수 있기 때문. 실제 접근 제어는 그대로 RLS가 한다.
- profile 행은 seed로만 생긴다(INSERT 정책 없음, PLAN대로). 프로필 저장 시 행이 없으면 실패 토스트.

## 사진
- 업로드 흐름: 사진 선택 → 브라우저에서 압축(WebP, 최대 1600px, 1MB 목표) → **브라우저 Supabase 클라이언트로 Storage에 바로 업로드** →
  폼의 값이 새 경로로 바뀜 → **폼의 `저장`을 누르면** Server Action이 DB 경로를 바꾸고 그다음 이전 파일을 삭제.
  (PLAN은 업로드 직후 DB 갱신처럼 읽히지만, 다른 칸과 함께 저장/취소되도록 폼 저장 시점에 반영했다.
  "저장하지 않은 내용" 확인과도 일관된다.)
- 폼을 저장하지 않고 닫거나, 저장 전에 사진을 여러 번 바꾸면 쓰이지 않게 된 파일은 `discardUploads` 액션이 지운다
  (DB에서 참조 중인 파일은 절대 지우지 않음).
- 서버는 클라이언트가 보낸 경로가 `profile/{uuid}.webp`, `items/{section_key}/{uuid}.webp` 형식일 때만 받는다.
- `toPublicUrl(path)`는 `getPublicUrl`과 같은 주소를 문자열로 만든다(클라이언트 인스턴스 불필요, 서버·브라우저 공용).
- 허용 형식: JPG·PNG·WebP·GIF(버킷 설정과 동일). GIF는 WebP 정지 이미지로 변환된다.

## 입력값 검증 (`lib/validation.ts`, 서버·브라우저 공용)
- PLAN 명시: title 100자, badge 30자, description 1000자, intro_en 1500자, URL은 http/https/mailto만.
- 추가로 정한 제한: 기관 100, 날짜 50, 이름 30, 나이·학년 30, 한 줄 소개 100, 키워드 8개×20자,
  사용 도구 10개×30자, 링크 6개(이름 30자, 주소 500자), 섹션 eyebrow 30 / 제목 30 / 설명 100.
- 링크에 scheme이 없으면 자동 보정: `a@b.com` → `mailto:a@b.com`, `example.com` → `https://example.com`.
- 섹션 설정에 없는 칸(예: 자격증의 설명)은 서버에서 빈 값으로 저장한다.

## UI
- 빈 섹션 안내 문구: PLAN은 기술·작품·관심사만 정했으므로 나머지 섹션은 짧은 문구를 직접 정했다(`lib/sections.ts`).
- 포인트 색(coral, mint, sun)은 흰 배경 위 글자로 쓰면 4.5:1이 안 돼서, **글자용으로만 진한 변형**을 추가했다:
  `--coral-ink #C2412D`, `--mint-ink #0F7A6C`, `--primary-ink #2549C4`, `--sun-ink #7A5200` (모두 크림/흰 배경에서 4.9:1 이상).
  배경·아이콘에는 원래 색을 쓴다.
- 항목 편집 도구는 카드 위를 덮지 않도록 카드 맨 위 별도 줄로 배치(360px에서도 버튼 5개가 44px로 들어감).
- 공통 UI 중 `Textarea`, `Field`는 `components/ui/Input.tsx`에 함께 있다. `Switch`를 추가했다.
- 한국어 IME: 키워드/도구 칩 입력에서 글자 조합 중 Enter는 무시(`isComposing`) → 마지막 글자 중복 방지.
- 접근성: 본문 바로가기 링크, 모든 아이콘 버튼 `aria-label`, 포커스 링, 모달 포커스 가두기·Esc 닫기, 스크롤 애니메이션은 `prefers-reduced-motion`에서 끔.

## PWA / SEO
- 아이콘(192·512·maskable·apple-touch·favicon)과 기본 OG 이미지(`public/icons/og-default.png`)는 SVG를 headless Chrome으로 렌더링해 만들었다.
- `allow_indexing=false`(기본) → 공개 화면 `robots: noindex, nofollow`. 루트 레이아웃 기본값도 noindex(안전한 쪽).
  `robots.txt`는 `/admin`, `/auth`만 막는다(검색엔진이 `/`의 noindex 메타를 읽을 수 있어야 하므로).
- 서비스 워커는 범위 밖(PLAN 12장).

## 성능
- Pretendard CSS(CDN)는 스크립트로 삽입한 `<link>`로 불러와 첫 화면 그리기를 막지 않게 했다(시스템 글꼴로 먼저 보이고 바뀜).
  JS가 꺼져 있으면 `<noscript>` 안의 `<link>`로 불러온다. 처음엔 일반 `<link>`였는데 render-blocking으로 Performance가 81~85였다.

## 개발 서버를 휴대폰에서 열 때
- Next.js 16 dev 서버는 `localhost`가 아닌 주소(예: `http://192.168.0.134:3000`)에서 dev 스크립트 요청을 막는다
  → 페이지는 보이지만 JS가 안 돌아 로그인 버튼 등이 동작하지 않았다.
- `next.config.ts`의 `allowedDevOrigins`에 이 PC의 사설 IPv4 주소를 자동으로 넣도록 했다(개발 모드에만 영향, 배포와 무관).
  설정 변경 후에는 dev 서버를 다시 시작해야 한다.
- 같은 이유(HTTP + IP 주소 = 보안 컨텍스트 아님)로 `crypto.randomUUID()`가 없어 사진 업로드가 실패했다.
  `lib/image.ts`에서 `crypto.getRandomValues()`로 UUID v4를 만드는 대체 경로를 추가했다. 배포(HTTPS)에서는 원래대로 `randomUUID()`를 쓴다.

## 추가 라이브러리
- 없음. (점검용 puppeteer-core·lighthouse는 프로젝트 밖 임시 폴더에서만 사용)

---

## 최종 점검 결과 (PLAN 14장) — 2026-11-15

검증 방법: 프로덕션 빌드(`next start`) + headless Chrome(360/375/768/1280px) + publishable key로 REST/Storage/Auth 직접 호출.
`npm run build`, `npm run lint` 모두 에러 없음.

**공개 화면**
- [x] 첫 화면에 `박지유 | 15세`, `도전 · 끈기` 칩 — DB 값으로 표시됨
- [x] 한 줄 소개·영문 소개가 비어 있으면 해당 줄 숨김 — 현재 둘 다 비어 있고 HTML에 없음
- [x] 안내 문구 미노출 — 공개 HTML에 "예)", 빈 섹션 안내 문구 없음
- [x] 편집 버튼·관리자 링크 없음 — 공개 HTML에 `/admin` 문자열 없음(© 길게 누르기만 있음)
- [x] 360 / 375 / 768 / 1280px 가로 스크롤 없음(scrollWidth = 화면 폭), 깨짐 없음
- [x] 한글 단어 중간 줄바꿈 없음 — `word-break: keep-all` 적용, 스크린샷 확인
- [x] 시드 데이터: 수상 4 · 자격증 1 · 동아리 3 · 봉사 1 표시, 항목 없는 기술·작품·관심사 섹션과 메뉴는 숨김

**편집 화면**
- [x] 로그인 없이 `/admin` → `/admin/login`으로 이동(307)
- [ ] 관리자 아닌 계정으로 로그인 시 거부 — *관리자 아닌 테스트 계정 필요*
- [x] anon으로 `items` insert/update/delete → 거부(insert 401 RLS 오류, update/delete 0행), profile·sections update 0행,
      `admin_users` insert 거부, Storage 업로드 거부(403). 시도 후 데이터 변화 없음 확인
- [ ] Hero 텍스트·키워드·사진 수정 후 유지 — *관리자 로그인 필요*
- [ ] 7개 섹션 항목 추가·수정·삭제·숨김·순서 변경 — *관리자 로그인 필요*
- [ ] 섹션 제목 변경·숨김·순서 변경 — *관리자 로그인 필요*
- [ ] 사진 업로드·교체·삭제, 이전 파일 정리 — *관리자 로그인 필요* (압축 자체는 확인: 7.56MB JPEG → 0.7MB WebP 1600×1200)
- [x] 저장하지 않고 닫으면 확인 창 — 샘플 데이터 화면에서 확인
- [x] 모바일 바텀 시트 / 데스크톱 모달 — 샘플 데이터 화면에서 확인

**보안·개인정보**
- [x] 코드에 service_role / secret key 없음(문서에 "쓰지 말라"는 문구만)
- [x] `.env.local`은 Git 제외(`git check-ignore` 확인), `.env.example`만 포함
- [x] 회원가입 꺼짐 — `/auth/v1/signup` 호출 시 422 `signup_disabled`
- [x] `allow_indexing` 기본 false → 공개 화면에 `noindex, nofollow` 메타

**Lighthouse (모바일, 로컬 `next start`, 3회)**
- Performance 84 / 89 / 86, Accessibility 100, Best Practices 100, SEO 66(noindex 때문 — 의도된 값)
- 로컬 측정은 편차가 커서 Vercel 배포 후 다시 측정 권장.
- PWA: manifest(standalone, 아이콘 192/512/maskable), apple-touch-icon, theme-color 적용 → "홈 화면에 추가" 가능 구성.