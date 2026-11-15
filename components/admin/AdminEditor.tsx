"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Info, Pencil, Plus, Settings, Trash } from "lucide-react";
import { deleteItem, moveItem, moveSection, setItemVisibility } from "@/app/admin/actions";
import { Hero } from "@/components/public/Hero";
import { ItemCard } from "@/components/public/ItemCard";
import { Section, sectionAnchorId } from "@/components/public/Section";
import { SectionNav } from "@/components/public/SectionNav";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { SECTION_CONFIG } from "@/lib/sections";
import type { ActionResult, Item, ItemsBySection, Profile, Section as SectionRow, SectionKey } from "@/lib/types";
import { AdminToolbar } from "./AdminToolbar";
import { ConfirmDialog } from "./ConfirmDialog";
import { ItemForm } from "./ItemForm";
import { ProfileForm } from "./ProfileForm";
import { SectionForm } from "./SectionForm";
import { ToastProvider, useToast } from "./Toast";

type Modal =
  | { type: "profile" }
  | { type: "section"; section: SectionRow }
  | { type: "item"; sectionKey: SectionKey; sectionTitle: string; item?: Item }
  | { type: "delete"; item: Item }
  | null;

type Props = { profile: Profile | null; sections: SectionRow[]; items: ItemsBySection };

export function AdminEditor(props: Props) {
  return (
    <ToastProvider>
      <Editor {...props} />
    </ToastProvider>
  );
}

function Editor({ profile, sections, items }: Props) {
  const toast = useToast();
  const [modal, setModal] = useState<Modal>(null);
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  /** Runs a quick action (move / hide / delete) with a toast for the result. */
  function run(key: string, action: () => Promise<ActionResult>, after?: () => void) {
    setBusyKey(key);
    startTransition(async () => {
      const result = await action();
      setBusyKey(null);
      if (result.ok) {
        toast.success();
        after?.();
      } else toast.error(result.error);
    });
  }

  const close = () => setModal(null);

  return (
    <>
      <AdminToolbar />
      <div className="pt-14 [&_section]:scroll-mt-32">
        <Hero
          profile={profile}
          fullHeight={false}
          action={
            <Button variant="secondary" size="sm" onClick={() => setModal({ type: "profile" })} className="shadow-sm">
              <Pencil aria-hidden className="size-4" /> 수정
            </Button>
          }
        />

        {!profile && (
          <p className="mx-auto mb-6 flex max-w-[1080px] items-start gap-2 px-5 text-coral-ink md:px-8">
            <Info aria-hidden className="mt-1 size-4 shrink-0" />
            프로필 데이터를 불러오지 못했어요. README의 안내대로 Supabase에서 SQL(001_init.sql → seed.sql)을 실행했는지 확인해 주세요.
          </p>
        )}

        <SectionNav
          className="top-14"
          name={profile?.name}
          items={sections.map((s) => ({ id: sectionAnchorId(s.key), label: s.title }))}
        />

        <main id="main" className="mx-auto max-w-[1080px] px-5 pb-24 md:px-8">
          {sections.map((section, index) => {
            const sectionItems = items[section.key] ?? [];
            const config = SECTION_CONFIG[section.key];
            const openAdd = () =>
              setModal({ type: "item", sectionKey: section.key, sectionTitle: section.title });

            return (
              <Section
                key={section.key}
                section={section}
                dimmed={!section.is_visible}
                headerAction={
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {!section.is_visible && <Chip tone="neutral">숨김</Chip>}
                    <div className="flex items-center">
                      <ToolButton
                        label={`${section.title} 섹션 위로`}
                        disabled={pending || index === 0}
                        onClick={() => run(`s-${section.key}`, () => moveSection(section.key, "up"))}
                      >
                        <ArrowUp className="size-5" />
                      </ToolButton>
                      <ToolButton
                        label={`${section.title} 섹션 아래로`}
                        disabled={pending || index === sections.length - 1}
                        onClick={() => run(`s-${section.key}`, () => moveSection(section.key, "down"))}
                      >
                        <ArrowDown className="size-5" />
                      </ToolButton>
                      <ToolButton
                        label={`${section.title} 섹션 설정`}
                        onClick={() => setModal({ type: "section", section })}
                      >
                        <Settings className="size-5" />
                      </ToolButton>
                    </div>
                  </div>
                }
                footer={
                  sectionItems.length > 0 && (
                    <Button variant="secondary" className="w-full border-dashed md:w-auto" onClick={openAdd}>
                      <Plus aria-hidden className="size-4" /> 항목 추가
                    </Button>
                  )
                }
              >
                {sectionItems.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center gap-4 rounded-[20px] border-2 border-dashed border-line bg-surface/60 px-5 py-10 text-center">
                    <p className="max-w-md text-ink-soft">{config.emptyText}</p>
                    <Button onClick={openAdd}>
                      <Plus aria-hidden className="size-4" /> 첫 항목 추가
                    </Button>
                  </div>
                ) : (
                  sectionItems.map((item, i) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      toolbar={
                        <ItemTools
                          item={item}
                          isFirst={i === 0}
                          isLast={i === sectionItems.length - 1}
                          disabled={pending}
                          busy={busyKey === item.id}
                          onEdit={() =>
                            setModal({ type: "item", sectionKey: section.key, sectionTitle: section.title, item })
                          }
                          onToggle={() => run(item.id, () => setItemVisibility(item.id, !item.is_visible))}
                          onMove={(dir) => run(item.id, () => moveItem(item.id, dir))}
                          onDelete={() => setModal({ type: "delete", item })}
                        />
                      }
                    />
                  ))
                )}
              </Section>
            );
          })}

          {sections.length === 0 && (
            <p className="py-20 text-center text-ink-soft">
              섹션이 없어요. Supabase에서 seed.sql을 실행했는지 확인해 주세요.
            </p>
          )}
        </main>
      </div>

      {modal?.type === "profile" && <ProfileForm profile={profile} onClose={close} />}
      {modal?.type === "section" && <SectionForm section={modal.section} onClose={close} />}
      {modal?.type === "item" && (
        <ItemForm
          key={modal.item?.id ?? `new-${modal.sectionKey}`}
          sectionKey={modal.sectionKey}
          sectionTitle={modal.sectionTitle}
          item={modal.item}
          onClose={close}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog
          title="이 항목을 삭제할까요?"
          message={`“${modal.item.title}” 항목이 삭제돼요. 사진도 함께 삭제돼요.`}
          confirmLabel="삭제"
          danger
          pending={pending}
          onCancel={close}
          onConfirm={() => {
            const target = modal.item;
            setBusyKey(target.id);
            startTransition(async () => {
              const result = await deleteItem(target.id);
              setBusyKey(null);
              if (result.ok) {
                toast.success("삭제했어요");
                close();
              } else toast.error(result.error);
            });
          }}
        />
      )}
    </>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-11 cursor-pointer items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 hover:text-ink",
        "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent",
        className,
      )}
    >
      <span aria-hidden className="contents">
        {children}
      </span>
    </button>
  );
}

function ItemTools({
  item,
  isFirst,
  isLast,
  disabled,
  busy,
  onEdit,
  onToggle,
  onMove,
  onDelete,
}: {
  item: Item;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onMove: (dir: "up" | "down") => void;
  onDelete: () => void;
}) {
  const name = item.title || "항목";
  return (
    <div className={cn("flex items-center", busy && "animate-pulse")}>
      <ToolButton label={`${name} 수정`} onClick={onEdit}>
        <Pencil className="size-[18px]" />
      </ToolButton>
      <ToolButton label={item.is_visible ? `${name} 숨기기` : `${name} 공개하기`} onClick={onToggle} disabled={disabled}>
        {item.is_visible ? <Eye className="size-[18px]" /> : <EyeOff className="size-[18px]" />}
      </ToolButton>
      <ToolButton label={`${name} 위로`} onClick={() => onMove("up")} disabled={disabled || isFirst}>
        <ArrowUp className="size-[18px]" />
      </ToolButton>
      <ToolButton label={`${name} 아래로`} onClick={() => onMove("down")} disabled={disabled || isLast}>
        <ArrowDown className="size-[18px]" />
      </ToolButton>
      <ToolButton label={`${name} 삭제`} onClick={onDelete} className="hover:text-coral-ink">
        <Trash className="size-[18px]" />
      </ToolButton>
    </div>
  );
}
