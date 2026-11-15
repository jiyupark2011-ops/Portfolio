"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Chip input: type and press Enter (or comma) to add, X to remove. IME-safe for Korean. */
export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  maxItems,
  maxLength,
  describedBy,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxItems: number;
  maxLength: number;
  describedBy?: string;
}) {
  const [draft, setDraft] = useState("");
  const full = value.length >= maxItems;

  function add() {
    const parts = draft
      .split(",")
      .map((s) => s.trim().slice(0, maxLength))
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    for (const p of parts) if (!next.includes(p) && next.length < maxItems) next.push(p);
    onChange(next);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Ignore Enter while a Korean syllable is still being composed.
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
      {value.length > 0 && (
        <ul className="mb-1 flex flex-wrap gap-1.5 px-1 pt-1">
          {value.map((tag, i) => (
            <li
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-0.5 rounded-full bg-sky py-0.5 pr-0.5 pl-3 text-[15px] font-semibold text-primary-ink"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label={`${tag} 삭제`}
                className="flex size-9 items-center justify-center rounded-full hover:bg-primary/10"
              >
                <X aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-1">
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          disabled={full}
          maxLength={maxLength * 2}
          enterKeyHint="done"
          placeholder={full ? `최대 ${maxItems}개까지 넣을 수 있어요` : placeholder}
          aria-describedby={describedBy}
          className="min-h-11 min-w-0 flex-1 bg-transparent px-2 text-base text-ink placeholder:text-ink-soft/70 focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim() || full}
          aria-label="추가"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-sky",
            "disabled:text-ink-soft/40 disabled:hover:bg-transparent",
          )}
        >
          <Plus aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  );
}
