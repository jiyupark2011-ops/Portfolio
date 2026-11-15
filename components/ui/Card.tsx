import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-line bg-surface shadow-[0_1px_2px_rgba(27,36,64,0.04),0_4px_16px_rgba(27,36,64,0.04)]",
        "transition-[transform,box-shadow] duration-200 motion-safe:md:hover:-translate-y-0.5 md:hover:shadow-[0_2px_4px_rgba(27,36,64,0.05),0_10px_28px_rgba(27,36,64,0.08)]",
        className,
      )}
      {...props}
    />
  );
}
