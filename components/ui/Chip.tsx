import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "sky" | "sun" | "coral" | "mint" | "neutral";

const tones: Record<Tone, string> = {
  sky: "bg-sky text-primary-ink",
  sun: "bg-sun/30 text-ink",
  coral: "bg-coral/15 text-coral-ink",
  mint: "bg-mint/15 text-mint-ink",
  neutral: "bg-ink/5 text-ink-soft",
};

export function Chip({ tone = "sky", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] leading-5 font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
