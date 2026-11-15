import { ExternalLink, LogOut, Pencil } from "lucide-react";

/** Fixed top bar shown only in edit mode. */
export function AdminToolbar() {
  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1080px] items-center justify-between gap-2 px-3 md:px-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sun px-3 py-1.5 text-sm font-bold text-ink">
          <Pencil aria-hidden className="size-4" />
          편집 모드
        </span>
        <div className="flex items-center gap-1">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:bg-ink/5"
          >
            <ExternalLink aria-hidden className="size-4" />
            <span className="sm:hidden">공개 화면</span>
            <span className="hidden sm:inline">공개 화면 보기</span>
            <span className="sr-only">(새 탭)</span>
          </a>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:bg-ink/5"
            >
              <LogOut aria-hidden className="size-4" />
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
