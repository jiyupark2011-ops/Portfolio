"use client";

import { cn } from "@/lib/cn";

export function Switch({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="block text-[15px] font-semibold text-ink">
          {label}
        </label>
        {description && (
          <p id={`${id}-help`} className="mt-0.5 text-[13px] leading-snug text-ink-soft">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-help` : undefined}
        onClick={() => onChange(!checked)}
        className="flex min-h-11 shrink-0 items-center"
      >
        <span
          className={cn(
            "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
            checked ? "bg-primary" : "bg-ink-soft/35",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 rounded-full bg-white shadow transition-transform",
              checked ? "translate-x-6" : "translate-x-1",
            )}
          />
        </span>
      </button>
    </div>
  );
}
