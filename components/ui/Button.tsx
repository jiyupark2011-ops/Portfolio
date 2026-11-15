import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-ink disabled:bg-ink-soft/40",
  secondary: "border border-line bg-surface text-ink hover:bg-sky disabled:text-ink-soft/60",
  ghost: "text-ink hover:bg-ink/5 disabled:text-ink-soft/60",
  danger: "bg-coral-ink text-white hover:bg-[#a33523] disabled:bg-ink-soft/40",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 text-[15px]",
  sm: "min-h-11 px-3 text-sm",
  icon: "size-11 justify-center p-0",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}
