"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet on mobile, centered modal on desktop.
 * `onRequestClose` is called for Esc, backdrop click and the X button — the caller decides whether to close.
 */
export function EditSheet({
  title,
  onRequestClose,
  children,
  footer,
  size = "form",
}: {
  title: string;
  onRequestClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "form" | "confirm";
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onRequestClose);

  useEffect(() => {
    closeRef.current = onRequestClose;
  }, [onRequestClose]);

  // Focus, Esc, focus trap, scroll lock
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (!panel) return;
      // Only the top-most dialog handles keys
      const dialogs = document.querySelectorAll("[data-edit-sheet]");
      if (dialogs[dialogs.length - 1] !== panel) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      } else if (e.key === "Tab") {
        const nodes = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
        if (nodes.length === 0) return;
        const firstNode = nodes[0];
        const lastNode = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === firstNode) {
          e.preventDefault();
          lastNode.focus();
        } else if (!e.shiftKey && document.activeElement === lastNode) {
          e.preventDefault();
          firstNode.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const isConfirm = size === "confirm";

  return (
    <div className={cn("fixed inset-0 flex items-end justify-center md:items-center md:p-6", isConfirm ? "z-[60]" : "z-50")}>
      <div aria-hidden className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={() => closeRef.current()} />
      <div
        ref={panelRef}
        data-edit-sheet
        role={isConfirm ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex w-full flex-col bg-surface shadow-2xl",
          "max-h-[92svh] rounded-t-[24px] md:rounded-[24px]",
          isConfirm ? "md:max-w-sm" : "md:max-h-[88vh] md:max-w-xl",
        )}
      >
        {/* Grab handle (mobile) */}
        <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line md:hidden" />

        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3 pb-2 md:px-6 md:pt-5">
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
          {!isConfirm && (
            <button
              type="button"
              onClick={() => closeRef.current()}
              aria-label="닫기"
              className="-mr-2 flex size-11 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
            >
              <X aria-hidden className="size-5" />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 md:px-6">{children}</div>

        {footer && (
          <div className="flex shrink-0 flex-col gap-2 border-t border-line px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:pb-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
