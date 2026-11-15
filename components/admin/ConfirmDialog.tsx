"use client";

import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EditSheet } from "./EditSheet";

/** Custom confirm dialog (window.confirm is not used). */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "취소",
  danger,
  pending,
  onConfirm,
  onCancel,
}: {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <EditSheet
      size="confirm"
      title={title}
      onRequestClose={() => !pending && onCancel()}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={pending} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} className="flex-1" onClick={onConfirm} disabled={pending}>
            {pending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {message && <p className="text-ink-soft">{message}</p>}
    </EditSheet>
  );
}
