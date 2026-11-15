"use client";

import { useState, useTransition } from "react";
import { updateSection } from "@/app/admin/actions";
import { Field, Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { requiredMessage } from "@/lib/sections";
import type { Section, SectionInput } from "@/lib/types";
import { LIMITS } from "@/lib/validation";
import { FormSheet } from "./FormSheet";
import { useToast } from "./Toast";

export function SectionForm({ section, onClose }: { section: Section; onClose: () => void }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [initial] = useState<SectionInput>(() => ({
    eyebrow: section.eyebrow,
    title: section.title,
    subtitle: section.subtitle,
    is_visible: section.is_visible,
  }));
  const [values, setValues] = useState<SectionInput>(initial);

  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const blockReason = !values.title.trim() ? requiredMessage("섹션 제목") : null;
  const set = <K extends keyof SectionInput>(key: K, value: SectionInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  function save() {
    startTransition(async () => {
      const result = await updateSection(section.key, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success();
      onClose();
    });
  }

  return (
    <FormSheet
      title="섹션 설정"
      dirty={dirty}
      blockReason={blockReason}
      pending={pending}
      onSave={save}
      onClose={onClose}
    >
      <Field id="section-eyebrow" label="영문 작은 제목" help="제목 위에 작게 보이는 영어 글자예요.">
        <Input
          id="section-eyebrow"
          value={values.eyebrow}
          onChange={(e) => set("eyebrow", e.target.value)}
          placeholder="예) AWARDS"
          maxLength={LIMITS.eyebrow}
          aria-describedby="section-eyebrow-help"
        />
      </Field>
      <Field id="section-title" label="섹션 제목" required>
        <Input
          id="section-title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="예) 수상 경력"
          maxLength={LIMITS.section_title}
          aria-required
          data-autofocus
        />
      </Field>
      <Field id="section-subtitle" label="설명 한 줄" help="섹션 제목 아래에 보이는 짧은 설명이에요. (선택)">
        <Input
          id="section-subtitle"
          value={values.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          placeholder="예) 도전해서 얻은 결과들이에요."
          maxLength={LIMITS.subtitle}
          aria-describedby="section-subtitle-help"
        />
      </Field>
      <Switch
        id="section-visible"
        label="공개 화면에 보이기"
        description="끄면 이 섹션 전체가 공개 화면과 메뉴에서 사라져요."
        checked={values.is_visible}
        onChange={(v) => set("is_visible", v)}
      />
    </FormSheet>
  );
}
