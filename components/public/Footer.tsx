"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Mail } from "lucide-react";
import type { ProfileLink } from "@/lib/types";

const LONG_PRESS_MS = 900;

export function Footer({ name, links, year }: { name: string; links: ProfileLink[]; year: number }) {
  const router = useRouter();
  const timer = useRef<number | null>(null);

  // Hidden admin entry: long-press the © mark.
  const start = () => {
    cancel();
    timer.current = window.setTimeout(() => router.push("/admin"), LONG_PRESS_MS);
  };
  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };

  const validLinks = links.filter((l) => l.url);

  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="mx-auto flex max-w-[1080px] flex-col items-center gap-5 px-5 py-10 text-center md:px-8">
        {validLinks.length > 0 && (
          <ul aria-label="연락 링크" className="flex flex-wrap justify-center gap-2">
            {validLinks.map((link, i) => {
              const isMail = link.url.startsWith("mailto:");
              return (
                <li key={`${link.url}-${i}`}>
                  <a
                    href={link.url}
                    {...(isMail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-4 font-semibold hover:bg-sky"
                  >
                    {isMail ? <Mail aria-hidden className="size-4" /> : <ExternalLink aria-hidden className="size-4" />}
                    {link.label || link.url.replace(/^mailto:/, "")}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-sm text-ink-soft">
          <span
            className="inline-block cursor-default px-1 select-none [-webkit-touch-callout:none]"
            onPointerDown={start}
            onPointerUp={cancel}
            onPointerLeave={cancel}
            onPointerCancel={cancel}
            onContextMenu={(e) => e.preventDefault()}
          >
            ©
          </span>{" "}
          {year} {name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
