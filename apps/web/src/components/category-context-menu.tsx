"use client";

import { useEffect, useRef, useState } from "react";
import type { SerializedCategory } from "@/app/dashboard/WeekView";
import { toast } from "sonner";

type Props = {
  category: SerializedCategory;
  x: number;
  y: number;
  onClose: () => void;
  onRenamed: (id: string, newName: string) => void;
  onDeleted: (id: string) => void;
};

export default function CategoryContextMenu({
  category,
  x,
  y,
  onClose,
  onRenamed,
  onDeleted,
}: Props) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(category.name);
  const [saving, setSaving] = useState(false);
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
    toast.success("Category renamed");
  }

  async function handleDelete() {
    await fetch(`/api/category/${category.id}`, { method: "DELETE" });
    onDeleted(category.id);
    onClose();
  }

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="fixed z-50 min-w-[160px] rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
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
            className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-gray-400"
          />
          <button
            disabled={saving}
            onClick={handleRename}
            className="shrink-0 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {saving ? "…" : "OK"}
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setRenaming(true)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Rename
          </button>
          <button
            onClick={handleDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition"
          >
            Remove
          </button>
        </>
      )}
    </div>
  );
}
