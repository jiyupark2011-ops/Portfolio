"use client";

import { useCallback, useRef } from "react";
import { discardUploads } from "@/app/admin/actions";

/**
 * Tracks files uploaded while a form is open, so files that end up unused
 * (form closed without saving, or photo replaced again before saving) are removed from Storage.
 */
export function useUploadSession() {
  const uploaded = useRef<Set<string>>(new Set());

  const track = useCallback((path: string) => {
    uploaded.current.add(path);
  }, []);

  /** After a successful save: remove every uploaded file except the one that was saved. */
  const finalize = useCallback((keepPath: string | null) => {
    const unused = [...uploaded.current].filter((p) => p !== keepPath);
    uploaded.current.clear();
    if (unused.length) void discardUploads(unused);
  }, []);

  /** Form closed without saving: remove everything uploaded in this session. */
  const discardAll = useCallback(() => {
    const all = [...uploaded.current];
    uploaded.current.clear();
    if (all.length) void discardUploads(all);
  }, []);

  return { track, finalize, discardAll };
}
