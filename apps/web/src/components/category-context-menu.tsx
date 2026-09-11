"use client";

import { useEffect, useRef, useState } from "react";
import { Pin, PinOff } from "lucide-react";
import type { SerializedCategory } from "@/app/dashboard/WeekView";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

type Props = {
  category: SerializedCategory;
  x: number;
  y: number;
  onClose: () => void;
  onRenamed: (id: string, newName: string) => void;
  onDeleted: (id: string) => void;
  onPinToggled?: (id: string, pinned: boolean) => void;
};

export default function CategoryContextMenu({
  category,
  x,
  y,
  onClose,
  onRenamed,
  onDeleted,
  onPinToggled,
}: Props) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(category.name);
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  async function handleRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === category.name) {
      onClose();
      return;
    }
    setSaving(true);
    await fetch(`/api/category/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setSaving(false);
    onRenamed(category.id, trimmed);
    onClose();
    toast.success(t("cat_renamed"));
  }

  async function handleDelete() {
    await fetch(`/api/category/${category.id}`, { method: "DELETE" });
    onDeleted(category.id);
    onClose();
  }

  async function handleTogglePin() {
    const pinned = !category.pinned;
    onPinToggled?.(category.id, pinned);
    onClose();
    try {
      const res = await fetch(`/api/category/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      });
      if (!res.ok) throw new Error("Failed to toggle pin");
      toast.success(pinned ? t("cat_pinned") : t("cat_unpinned"));
    } catch {
      onPinToggled?.(category.id, !pinned);
      toast.error(t("cat_pin_error"));
    }
  }

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="fixed z-50 min-w-[160px] rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg"
    >
      {renaming ? (
        <div className="flex items-center gap-1 px-2 py-1">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") onClose();
            }}
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500"
          />
          <button
            disabled={saving}
            onClick={handleRename}
            className="shrink-0 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 disabled:opacity-50 transition"
          >
            {saving ? "…" : t("ok")}
          </button>
        </div>
      ) : (
        <>
          {onPinToggled && (
            <button
              onClick={handleTogglePin}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {category.pinned ? (
                <PinOff size={13} className="shrink-0" />
              ) : (
                <Pin size={13} className="shrink-0" />
              )}
              {category.pinned ? t("cat_unpin") : t("cat_pin")}
            </button>
          )}
          <button
            onClick={() => setRenaming(true)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            {t("cat_rename")}
          </button>
          <button
            onClick={handleDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition"
          >
            {t("cat_remove")}
          </button>
        </>
      )}
    </div>
  );
}
