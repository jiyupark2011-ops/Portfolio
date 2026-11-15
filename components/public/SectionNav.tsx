"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type NavItem = { id: string; label: string };

export function SectionNav({
  items,
  name,
  className,
}: {
  items: NavItem[];
  /** Shown at the left on desktop. */
  name?: string;
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const idsKey = items.map((i) => i.id).join(",");

  // Highlight the section currently in view
  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];
    const targets = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        const first = ids.find((id) => visible.has(id)) ?? null;
        setActiveId(first);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [idsKey]);

  // Keep the active chip visible in the horizontal strip (mobile)
  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const link = listRef.current.querySelector<HTMLElement>(`a[href="#${activeId}"]`);
    if (!link) return;
    const list = listRef.current;
    const left = link.offsetLeft - list.clientWidth / 2 + link.clientWidth / 2;
    list.scrollTo({ left, behavior: "smooth" });
  }, [activeId]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="섹션 바로가기"
      className={cn("sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md", className)}
    >
      <div className="mx-auto flex max-w-[1080px] items-center gap-4 px-5 md:px-8">
        {name && <span className="hidden shrink-0 text-base font-extrabold md:block">{name}</span>}
        <ul ref={listRef} className="no-scrollbar -mx-5 flex flex-1 gap-1.5 overflow-x-auto px-5 py-2 md:mx-0 md:justify-end md:px-0">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id} className="shrink-0">
                <a
                  href={`#${item.id}`}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold transition-colors",
                    active ? "bg-ink text-white" : "text-ink-soft hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
