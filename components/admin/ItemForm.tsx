"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { createItem, updateItem } from "@/app/admin/actions";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { SECTION_CONFIG, requiredMessage, type FieldConfig } from "@/lib/sections";
import type { Item, ItemInput, SectionKey } from "@/lib/types";
import { LIMITS } from "@/lib/validation";
import { FormSheet } from "./FormSheet";
import { ImageUploader } from "./ImageUploader";
import { TagInput } from "./TagInput";
import { useToast } from "./Toast";
import { useUploadSession } from "./useUploadSession";

type Values = Omit<ItemInput, "link_url"> & { link_url: string };

function toValues(item?: Item): Values {
  return {
    title: item?.title ?? "",
    badge: item?.badge ?? "",
    organization: item?.organization ?? "",
    date_label: item?.date_label ?? "",
    description: item?.description ?? "",
    level: item?.level ?? null,
    tags: item?.tags ?? [],
    link_url: item?.link_url ?? "",
  };
}

const TEXT_LIMITS = {
  title: LIMITS.title,
  badge: LIMITS.badge,
  organization: LIMITS.organization,
  date_label: LIMITS.date_label,
  link_url: LIMITS.url,
} as const;

export function ItemForm({
  sectionKey,
  sectionTitle,
  item,
  onClose,
}: {
  sectionKey: SectionKey;
  sectionTitle: string;
  /** Omit to create a new item. */
  item?: Item;
  onClose: () => void;
}) {
  const config = SECTION_CONFIG[sectionKey];
  const toast = useToast();
  const uploads = useUploadSession();
  const [pending, startTransition] = useTransition();
  const [initial] = useState(() => ({ values: toValues(item), imagePath: item?.image_path ?? null }));
  const [values, setValues] = useState<Values>(initial.values);
  const [imagePath, setImagePath] = useState<string | null>(initial.imagePath);
  const [uploading, setUploading] = useState(false);

  const titleField = config.fields.find((f) => f.key === "title");
  const dirty = JSON.stringify(values) !== JSON.stringify(initial.values) || imagePath !== initial.imagePath;
  const blockReason = !values.title.trim() ? requiredMessage(titleField?.label ?? "제목") : null;

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  function save() {
    startTransition(async () => {
      const imageChanged = imagePath !== initial.imagePath;
      const result = item
        ? await updateItem(item.id, values, imageChanged ? imagePath : undefined)
        : await createItem(sectionKey, values, imagePath);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      uploads.finalize(imagePath);
      toast.success();
      onClose();
    });
  }

  function renderField(field: FieldConfig) {
    const id = `item-${field.key}`;
    const helpId = field.help ? `${id}-help` : undefined;

    switch (field.key) {
      case "description":
        return (
          <Field key={field.key} id={id} label={field.label} help={field.help}>
            <Textarea
              id={id}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={field.placeholder}
              maxLength={LIMITS.description}
              aria-describedby={helpId}
              rows={4}
            />
          </Field>
        );
      case "tags":
        return (
          <Field key={field.key} id={id} label={field.label} help={field.help}>
            <TagInput
              id={id}
              value={values.tags}
              onChange={(tags) => set("tags", tags)}
              placeholder={field.placeholder}
              maxItems={LIMITS.tags}
              maxLength={LIMITS.tag}
              describedBy={helpId}
            />
          </Field>
        );
      case "level":
        return <LevelPicker key={field.key} field={field} value={values.level} onChange={(lv) => set("level", lv)} />;
      case "image":
        return (
          <ImageUploader
            key={field.key}
            id={id}
            label={field.label}
            help={field.help}
            value={imagePath}
            onChange={setImagePath}
            onUploaded={uploads.track}
            onBusyChange={setUploading}
            target={{ kind: "item", sectionKey }}
          />
        );
      default: {
        const key = field.key as keyof typeof TEXT_LIMITS;
        return (
          <Field key={field.key} id={id} label={field.label} required={field.required} help={field.help}>
            <Input
              id={id}
              type={key === "link_url" ? "url" : "text"}
              inputMode={key === "link_url" ? "url" : undefined}
              value={values[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={field.placeholder}
              maxLength={TEXT_LIMITS[key]}
              aria-describedby={helpId}
              aria-required={field.required || undefined}
              data-autofocus={key === "title" ? true : undefined}
            />
          </Field>
        );
      }
    }
  }

  return (
    <FormSheet
      title={item ? `${sectionTitle} 수정` : `${sectionTitle} 추가`}
      dirty={dirty}
      blockReason={blockReason}
      busy={uploading}
      pending={pending}
      onSave={save}
      onClose={onClose}
      onDiscard={uploads.discardAll}
    >
      {config.fields.map(renderField)}
    </FormSheet>
  );
}

function LevelPicker({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: number | null;
  onChange: (level: number | null) => void;
}) {
  const labels = ["입문", "기초", "보통", "잘함", "능숙"];
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-[15px] font-semibold text-ink">{field.label}</legend>
      <div role="radiogroup" aria-label={field.label} className="flex flex-wrap items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}점 (${labels[n - 1]})`}
            onClick={() => onChange(value === n ? null : n)}
            className="flex size-11 items-center justify-center rounded-full hover:bg-mint/10"
          >
            <Star
              aria-hidden
              className={cn("size-7", value !== null && n <= value ? "fill-mint text-mint" : "fill-transparent text-ink-soft/40")}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-ink-soft">{value ? `${value}점 · ${labels[value - 1]}` : "선택 안 함"}</span>
      </div>
      {field.help && <p className="text-[13px] leading-snug text-ink-soft">{field.help}</p>}
    </fieldset>
  );
}
