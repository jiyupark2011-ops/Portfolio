"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { updateProfile } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { PROFILE_FIELDS as F, requiredMessage } from "@/lib/sections";
import type { Profile, ProfileInput } from "@/lib/types";
import { LIMITS } from "@/lib/validation";
import { FormSheet } from "./FormSheet";
import { ImageUploader } from "./ImageUploader";
import { TagInput } from "./TagInput";
import { useToast } from "./Toast";
import { useUploadSession } from "./useUploadSession";

function toValues(p: Profile | null): ProfileInput {
  return {
    name: p?.name ?? "",
    age_label: p?.age_label ?? "",
    tagline: p?.tagline ?? "",
    keywords: p?.keywords ?? [],
    intro_en: p?.intro_en ?? "",
    links: p?.links ?? [],
    allow_indexing: p?.allow_indexing ?? false,
  };
}

export function ProfileForm({ profile, onClose }: { profile: Profile | null; onClose: () => void }) {
  const toast = useToast();
  const uploads = useUploadSession();
  const [pending, startTransition] = useTransition();
  const [initial] = useState(() => ({ values: toValues(profile), photoPath: profile?.photo_path ?? null }));
  const [values, setValues] = useState<ProfileInput>(initial.values);
  const [photoPath, setPhotoPath] = useState<string | null>(initial.photoPath);
  const [uploading, setUploading] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(initial.values) || photoPath !== initial.photoPath;
  const blockReason = !values.name.trim() ? requiredMessage(F.name.label) : null;

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const setLink = (index: number, patch: Partial<{ label: string; url: string }>) =>
    set(
      "links",
      values.links.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );

  function save() {
    startTransition(async () => {
      const photoChanged = photoPath !== initial.photoPath;
      const result = await updateProfile(values, photoChanged ? photoPath : undefined);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      uploads.finalize(photoPath);
      toast.success();
      onClose();
    });
  }

  return (
    <FormSheet
      title="프로필 수정"
      dirty={dirty}
      blockReason={blockReason}
      busy={uploading}
      pending={pending}
      onSave={save}
      onClose={onClose}
      onDiscard={uploads.discardAll}
    >
      <Field id="profile-name" label={F.name.label} required>
        <Input
          id="profile-name"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder={F.name.placeholder}
          maxLength={LIMITS.name}
          aria-required
          data-autofocus
        />
      </Field>

      <Field id="profile-age" label={F.age_label.label} help={F.age_label.help}>
        <Input
          id="profile-age"
          value={values.age_label}
          onChange={(e) => set("age_label", e.target.value)}
          placeholder={F.age_label.placeholder}
          maxLength={LIMITS.age_label}
          aria-describedby="profile-age-help"
        />
      </Field>

      <Field id="profile-keywords" label={F.keywords.label} help={F.keywords.help}>
        <TagInput
          id="profile-keywords"
          value={values.keywords}
          onChange={(k) => set("keywords", k)}
          placeholder={F.keywords.placeholder}
          maxItems={LIMITS.keywords}
          maxLength={LIMITS.keyword}
          describedBy="profile-keywords-help"
        />
      </Field>

      <Field id="profile-tagline" label={F.tagline.label} help={`${F.tagline.help} (지금 ${values.tagline.trim().length}자)`}>
        <Input
          id="profile-tagline"
          value={values.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder={F.tagline.placeholder}
          maxLength={LIMITS.tagline}
          aria-describedby="profile-tagline-help"
        />
      </Field>

      <Field id="profile-intro" label={F.intro_en.label} help={F.intro_en.help}>
        <Textarea
          id="profile-intro"
          lang="en"
          value={values.intro_en}
          onChange={(e) => set("intro_en", e.target.value)}
          placeholder={F.intro_en.placeholder}
          maxLength={LIMITS.intro_en}
          aria-describedby="profile-intro-help"
          rows={5}
        />
      </Field>

      <ImageUploader
        id="profile-photo"
        label={F.photo.label}
        help={F.photo.help}
        value={photoPath}
        onChange={setPhotoPath}
        onUploaded={uploads.track}
        onBusyChange={setUploading}
        target={{ kind: "profile" }}
        round
      />

      <fieldset className="space-y-2">
        <legend className="text-[15px] font-semibold text-ink">{F.links.label}</legend>
        <p className="text-[13px] leading-snug text-ink-soft">{F.links.help}</p>
        {values.links.map((link, i) => (
          <div key={i} className="flex items-start gap-2 rounded-xl border border-line p-2">
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[8rem_1fr]">
              <Input
                aria-label={`링크 ${i + 1} 이름`}
                value={link.label}
                onChange={(e) => setLink(i, { label: e.target.value })}
                placeholder="예) Email"
                maxLength={LIMITS.link_label}
              />
              <Input
                aria-label={`링크 ${i + 1} 주소`}
                value={link.url}
                onChange={(e) => setLink(i, { url: e.target.value })}
                placeholder="예) you@example.com, https://…"
                inputMode="url"
                maxLength={LIMITS.url}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`링크 ${i + 1} 삭제`}
              onClick={() =>
                set(
                  "links",
                  values.links.filter((_, j) => j !== i),
                )
              }
            >
              <X aria-hidden className="size-5" />
            </Button>
          </div>
        ))}
        {values.links.length < LIMITS.links && (
          <Button variant="secondary" size="sm" onClick={() => set("links", [...values.links, { label: "", url: "" }])}>
            <Plus aria-hidden className="size-4" /> 링크 추가
          </Button>
        )}
      </fieldset>

      <Switch
        id="profile-indexing"
        label={F.allow_indexing.label}
        description={F.allow_indexing.help}
        checked={values.allow_indexing}
        onChange={(v) => set("allow_indexing", v)}
      />
    </FormSheet>
  );
}
