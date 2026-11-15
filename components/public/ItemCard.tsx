import Image from "next/image";
import type { ReactNode } from "react";
import { ExternalLink, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { toPublicUrl } from "@/lib/image";
import { ACCENT_CLASSES, SECTION_CONFIG } from "@/lib/sections";
import type { Item } from "@/lib/types";

type Props = {
  item: Item;
  /** Admin-only tool buttons, rendered as a strip at the top of the card. */
  toolbar?: ReactNode;
};

export function ItemCard({ item, toolbar }: Props) {
  const config = SECTION_CONFIG[item.section_key];
  const accent = ACCENT_CLASSES[config.accent];
  const Icon = config.icon;
  const imageUrl = toPublicUrl(item.image_path);
  const hidden = !item.is_visible;
  const meta = [item.organization, item.date_label].map((v) => v?.trim()).filter(Boolean);
  const imageSizes = "(min-width: 1024px) 340px, (min-width: 768px) 50vw, 100vw";

  const toolbarStrip = toolbar && (
    <div className="flex items-center justify-between gap-2 border-b border-line bg-bg/60 py-0.5 pr-1 pl-3">
      {hidden ? <Chip tone="neutral">숨김</Chip> : <span />}
      <div className="flex items-center">{toolbar}</div>
    </div>
  );

  const imageBlock = (
    <div className={cn("relative aspect-[16/10] overflow-hidden", accent.softBg)}>
      {imageUrl ? (
        <Image src={imageUrl} alt={item.title || "항목 사진"} fill sizes={imageSizes} className="object-cover" />
      ) : (
        <div aria-hidden className={cn("flex h-full items-center justify-center", accent.text)}>
          <Icon className="size-10 opacity-70" />
        </div>
      )}
    </div>
  );

  const description = item.description?.trim() && (
    <p className="mt-2 whitespace-pre-line text-ink-soft">{item.description.trim()}</p>
  );

  const link = item.link_url && (
    <a
      href={item.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:underline"
    >
      자세히 보기 <ExternalLink aria-hidden className="size-4" />
      <span className="sr-only">(새 창)</span>
    </a>
  );

  const badge = item.badge?.trim() && (
    <span className={cn("shrink-0 rounded-full px-3 py-1 text-[13px] leading-5 font-bold", accent.badge)}>
      {item.badge.trim()}
    </span>
  );

  const cardClass = cn("flex flex-col overflow-hidden", hidden && "opacity-60");

  // Works: image-first card
  if (item.section_key === "works") {
    const tags = item.tags.filter(Boolean);
    return (
      <Card className={cardClass}>
        {toolbarStrip}
        {imageBlock}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-lg leading-snug font-bold">{item.title}</h3>
          {item.date_label?.trim() && <p className="mt-1 text-sm text-ink-soft">{item.date_label.trim()}</p>}
          {description}
          {tags.length > 0 && (
            <ul aria-label="사용 도구" className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <li key={`${tag}-${i}`}>
                  <Chip tone="sky">{tag}</Chip>
                </li>
              ))}
            </ul>
          )}
          {link}
        </div>
      </Card>
    );
  }

  // Skills: level stars + category chip
  if (item.section_key === "skills") {
    const level = item.level ?? 0;
    return (
      <Card className={cardClass}>
        {toolbarStrip}
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <h3 className="text-lg leading-snug font-bold">{item.title}</h3>
            {badge}
          </div>
          {level > 0 && (
            <div className="mt-2 flex items-center gap-0.5" role="img" aria-label={`숙련도 5점 중 ${level}점`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  aria-hidden
                  className={cn("size-[18px]", n <= level ? "fill-mint text-mint" : "fill-transparent text-line")}
                />
              ))}
            </div>
          )}
          {description}
        </div>
      </Card>
    );
  }

  // Awards, certificates, clubs, volunteer, interests
  return (
    <Card className={cardClass}>
      {toolbarStrip}
      {imageUrl && imageBlock}
      <div className="flex gap-4 p-5">
        {!imageUrl && (
          <span
            aria-hidden
            className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", accent.softBg, accent.text)}
          >
            <Icon className="size-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <h3 className="min-w-0 flex-1 basis-40 text-lg leading-snug font-bold">{item.title}</h3>
            {badge}
          </div>
          {meta.length > 0 && <p className="mt-1 text-sm text-ink-soft">{meta.join(" · ")}</p>}
          {description}
          {link}
        </div>
      </div>
    </Card>
  );
}
