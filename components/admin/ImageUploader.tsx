"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, ImagePlus, LoaderCircle, Trash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES, compressImage, makeImagePath, toPublicUrl } from "@/lib/image";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";
import type { SectionKey } from "@/lib/types";
import { useToast } from "./Toast";

type Target = { kind: "profile" } | { kind: "item"; sectionKey: SectionKey };

const TYPE_ERROR = "JPG, PNG, WebP 사진만 올릴 수 있어요.";

/**
 * Select → compress in the browser (WebP, ≤1600px, ~1MB) → upload straight to Storage.
 * The new path is handed to the form; the DB is updated (and the old file removed) when the form is saved.
 */
export function ImageUploader({
  id,
  label,
  help,
  value,
  onChange,
  onUploaded,
  onBusyChange,
  target,
  round,
}: {
  id: string;
  label: string;
  help?: string;
  value: string | null;
  onChange: (path: string | null) => void;
  /** Called for every uploaded file so unsaved uploads can be cleaned up. */
  onUploaded: (path: string) => void;
  onBusyChange?: (busy: boolean) => void;
  target: Target;
  round?: boolean;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  function setBusyState(next: boolean) {
    setBusy(next);
    onBusyChange?.(next);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error(TYPE_ERROR);
      return;
    }

    setLocalPreview(URL.createObjectURL(file));
    setBusyState(true);
    try {
      const compressed = await compressImage(file);
      if (compressed.size > MAX_UPLOAD_BYTES) {
        toast.error(TYPE_ERROR);
        setLocalPreview(null);
        return;
      }

      const path = makeImagePath(target);
      const { error } = await createClient()
        .storage.from(STORAGE_BUCKET)
        .upload(path, compressed, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
      if (error) throw error;

      onUploaded(path);
      onChange(path);
    } catch (err) {
      console.error("[upload]", err);
      toast.error("사진을 올리지 못했어요. 다시 시도해 주세요.");
      setLocalPreview(null);
    } finally {
      setBusyState(false);
    }
  }

  const remoteUrl = toPublicUrl(value);
  const previewUrl = value || busy ? (localPreview ?? remoteUrl) : null;
  const helpId = help ? `${id}-help` : undefined;

  return (
    <div className="space-y-2">
      <p id={`${id}-label`} className="text-[15px] font-semibold text-ink">
        {label}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden border border-line bg-bg text-ink-soft",
            round ? "size-24 rounded-full" : "aspect-[16/10] w-40 rounded-xl",
          )}
        >
          {previewUrl ? (
            <Image src={previewUrl} alt="선택한 사진 미리보기" fill sizes="160px" className="object-cover" unoptimized />
          ) : (
            <Camera aria-hidden className="size-7 opacity-60" />
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
              <LoaderCircle aria-hidden className="size-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onFile}
            aria-labelledby={`${id}-label`}
            aria-describedby={helpId}
            tabIndex={-1}
          />
          {busy ? (
            <p role="status" className="flex min-h-11 items-center gap-2 text-[15px] font-semibold text-primary-ink">
              사진 올리는 중…
            </p>
          ) : value ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
                <RefreshCw aria-hidden className="size-4" /> 교체
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-coral-ink"
                onClick={() => {
                  setLocalPreview(null);
                  onChange(null);
                }}
              >
                <Trash aria-hidden className="size-4" /> 삭제
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              <ImagePlus aria-hidden className="size-4" /> 사진 선택
            </Button>
          )}
        </div>
      </div>

      {help && (
        <p id={helpId} className="text-[13px] leading-snug text-ink-soft">
          {help}
        </p>
      )}
    </div>
  );
}
