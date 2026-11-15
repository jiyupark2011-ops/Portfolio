"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { EditSheet } from "./EditSheet";

/**
 * Edit form inside a bottom sheet / modal, with:
 * - disabled save + hint while a required field is empty
 * - "unsaved changes" confirmation on close
 */
export function FormSheet({
  title,
  dirty,
  blockReason,
  busy,
  pending,
  onSave,
  onClose,
  onDiscard,
  children,
}: {
  title: string;
  dirty: boolean;
  /** e.g. "대회명을 입력해 주세요." — disables the save button when set. */
  blockReason?: string | null;
  /** Something is in progress (e.g. photo upload) — save is disabled. */
  busy?: boolean;
  pending: boolean;
  onSave: () => void;
  onClose: () => void;
  /** Called when the user closes without saving. */
  onDiscard?: () => void;
  children: ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);

  function requestClose() {
    if (pending) return;
    if (dirty) {
      setConfirming(true);
      return;
    }
    onDiscard?.();
    onClose();
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (pending || busy || blockReason) return;
    onSave();
  }

  const formId = useId();

  return (
    <>
      <EditSheet
        title={title}
        onRequestClose={requestClose}
        footer={
          <>
            {blockReason && (
              <p role="status" className="text-[13px] font-semibold text-coral-ink">
                {blockReason}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={requestClose} disabled={pending}>
                취소
              </Button>
              <Button type="submit" form={formId} className="flex-1" disabled={pending || busy || Boolean(blockReason)}>
                {pending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
                저장
              </Button>
            </div>
          </>
        }
      >
        <form id={formId} onSubmit={submit} className="space-y-6 pt-2 pb-2" noValidate>
          {children}
        </form>
      </EditSheet>

      {confirming && (
        <ConfirmDialog
          title="저장하지 않은 내용이 있어요. 닫을까요?"
          message="닫으면 지금까지 고친 내용이 사라져요."
          confirmLabel="닫기"
          cancelLabel="계속 편집"
          danger
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onDiscard?.();
            onClose();
          }}
        />
      )}
    </>
  );
}
