import Image from "next/image";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { toPublicUrl } from "@/lib/image";
import type { Profile } from "@/lib/types";

export function Hero({
  profile,
  action,
  scrollTargetId,
  fullHeight = true,
}: {
  profile: Profile | null;
  /** Admin-only slot (e.g. edit button). */
  action?: ReactNode;
  scrollTargetId?: string;
  fullHeight?: boolean;
}) {
  const name = profile?.name || "";
  const ageLabel = profile?.age_label || "";
  const keywords = (profile?.keywords ?? []).filter(Boolean);
  const tagline = profile?.tagline?.trim();
  const introEn = profile?.intro_en?.trim();
  const photoUrl = toPublicUrl(profile?.photo_path);

  return (
    <header
      className={`relative isolate flex items-center overflow-hidden ${fullHeight ? "min-h-svh" : "min-h-[80svh]"}`}
    >
      {/* Soft decorative color fields */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-sun/25 blur-3xl md:size-96" />
        <div className="absolute bottom-0 -left-24 size-64 rounded-full bg-mint/15 blur-3xl md:size-80" />
      </div>

      <div className="mx-auto w-full max-w-[1080px] px-5 py-16 md:px-8">
        {action && <div className="absolute top-4 right-4 md:top-6 md:right-8">{action}</div>}

        <div className="flex flex-col items-center gap-10 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div className="max-w-2xl md:order-1">
            <h1 className="text-[40px] leading-tight font-extrabold tracking-tight md:text-[64px]">
              {name || <span className="text-ink-soft">이름</span>}
              {ageLabel && (
                <span className="ml-3 align-middle text-[22px] font-semibold text-ink-soft md:text-[30px]">
                  <span aria-hidden className="mr-3 text-line">
                    |
                  </span>
                  {ageLabel}
                </span>
              )}
            </h1>

            {keywords.length > 0 && (
              <ul
                aria-label="키워드"
                className="mt-6 flex flex-wrap items-center justify-center gap-2 md:justify-start"
              >
                {keywords.map((keyword, i) => (
                  <li key={`${keyword}-${i}`} className="flex items-center gap-2">
                    {i > 0 && (
                      <span aria-hidden className="text-ink-soft">
                        ·
                      </span>
                    )}
                    <span className="rounded-full border border-line bg-surface px-4 py-1.5 text-lg font-bold shadow-sm">
                      <span className="highlight">{keyword}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {tagline && <p className="mt-6 text-lg font-medium md:text-xl">{tagline}</p>}

            {introEn && (
              <blockquote
                lang="en"
                className="mx-auto mt-6 max-w-xl border-l-4 border-primary pl-4 text-left text-[17px] leading-relaxed text-ink-soft md:mx-0 md:text-lg"
              >
                {introEn}
              </blockquote>
            )}
          </div>

          {photoUrl && (
            <div className="relative size-44 shrink-0 overflow-hidden rounded-full border-4 border-surface shadow-lg ring-4 ring-sun/60 md:order-2 md:size-72">
              <Image
                src={photoUrl}
                alt={`${name || "프로필"} 사진`}
                fill
                sizes="(min-width: 768px) 288px, 176px"
                className="object-cover"
                preload
              />
            </div>
          )}
        </div>
      </div>

      {scrollTargetId && (
        <a
          href={`#${scrollTargetId}`}
          aria-label="아래로 스크롤"
          className="absolute bottom-6 left-1/2 flex size-11 -translate-x-1/2 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 motion-safe:animate-bounce"
        >
          <ChevronDown aria-hidden className="size-6" />
        </a>
      )}
    </header>
  );
}
