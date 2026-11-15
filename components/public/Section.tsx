import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ACCENT_CLASSES, SECTION_CONFIG } from "@/lib/sections";
import type { Section as SectionRow } from "@/lib/types";

export function sectionAnchorId(key: string) {
  return `section-${key}`;
}

export function Section({
  section,
  children,
  headerAction,
  footer,
  dimmed,
}: {
  section: SectionRow;
  children: ReactNode;
  /** Admin-only slot next to the title. */
  headerAction?: ReactNode;
  /** Admin-only slot below the items. */
  footer?: ReactNode;
  dimmed?: boolean;
}) {
  const config = SECTION_CONFIG[section.key];
  const accent = ACCENT_CLASSES[config.accent];
  const Icon = config.icon;
  const headingId = `${sectionAnchorId(section.key)}-title`;

  return (
    <section
      id={sectionAnchorId(section.key)}
      aria-labelledby={headingId}
      data-section-key={section.key}
      className="scroll-mt-20 py-10 md:py-16"
    >
      <div className="mb-8 flex items-start justify-between gap-4 md:mb-10">
        <div className={cn("flex items-start gap-3", dimmed && "opacity-50")}>
          <span
            aria-hidden
            className={cn("mt-1 flex size-11 shrink-0 items-center justify-center rounded-full", accent.softBg, accent.text)}
          >
            <Icon className="size-5" />
          </span>
          <div>
            {section.eyebrow && (
              <p className={cn("text-[13px] font-bold tracking-[0.12em] uppercase", accent.text)}>{section.eyebrow}</p>
            )}
            <h2 id={headingId} className="text-[26px] leading-snug font-bold md:text-[34px]">
              {section.title}
            </h2>
            {section.subtitle && <p className="mt-1 text-ink-soft">{section.subtitle}</p>}
          </div>
        </div>
        {headerAction}
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5",
          config.layout === "grid3" && "lg:grid-cols-3",
        )}
      >
        {children}
      </div>

      {footer && <div className="mt-5">{footer}</div>}
    </section>
  );
}
