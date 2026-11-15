import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "min-h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-28 resize-y leading-relaxed", className)} {...props} />;
}

/** Label + control + help text + error text, all wired for accessibility. */
export function Field({
  id,
  label,
  required,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[15px] font-semibold text-ink">
        {label}
        {required && <span className="ml-1 text-coral-ink">(필수)</span>}
      </label>
      {children}
      {help && (
        <p id={`${id}-help`} className="text-[13px] leading-snug text-ink-soft">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[13px] font-semibold text-coral-ink">
          {error}
        </p>
      )}
    </div>
  );
}
