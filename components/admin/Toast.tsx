"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Check, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<(kind: ToastKind, message: string) => void>(() => {});

export function useToast() {
  const show = useContext(ToastContext);
  return {
    success: (message = "저장했어요") => show("success", message),
    error: (message = "저장에 실패했어요. 다시 시도해 주세요.") => show("error", message),
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, kind, message }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), kind === "error" ? 5000 : 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex max-w-md items-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold shadow-lg",
              t.kind === "success" ? "bg-ink text-white" : "bg-coral-ink text-white",
            )}
          >
            {t.kind === "success" ? <Check aria-hidden className="size-4" /> : <Info aria-hidden className="size-4" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
