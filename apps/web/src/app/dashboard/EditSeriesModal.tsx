"use client";

import { useEffect, useState } from "react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import CategorySelect from "@/components/category-select";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

export default function EditSeriesModal({
  task,
  categories,
  onClose,
  onSaved,
}: {
  task: SerializedTask;
  categories: SerializedCategory[];
  onClose: () => void;
  onSaved: (
    recurringTaskId: string,
    changes: Pick<
      SerializedTask,
      "title" | "categoryId" | "notes" | "category"
    >,
  ) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [categoryId, setCategoryId] = useState(task.categoryId ?? "none");
  const [notes, setNotes] = useState(task.notes ?? "");
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleBackdrop(e: React.MouseEvent) {
    e.stopPropagation();
    if (e.target === e.currentTarget) onClose();
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!title.trim() || !task.recurringTaskId) return;
    setSaving(true);

    const resolvedCategoryId = categoryId === "none" ? null : categoryId;

    await fetch(`/api/recurring-task/${task.recurringTaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        categoryId: resolvedCategoryId,
        notes: notes.trim() || null,
      }),
    });

    setSaving(false);
    onSaved(task.recurringTaskId, {
      title: title.trim(),
      categoryId: resolvedCategoryId,
      notes: notes.trim() || null,
      category: categories.find((c) => c.id === resolvedCategoryId) ?? null,
    });
    onClose();
    toast.success(t("edit_series_save"));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md mx-4 sm:mx-auto rounded-2xl bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t("edit_series_heading")}
            </h2>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {t("edit_series_subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("edit_task_label_title")}</label>
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("edit_task_label_category")}
            </label>
            <CategorySelect
              value={categoryId}
              onChange={setCategoryId}
              categories={categories}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("edit_task_label_notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition"
            >
              {saving ? t("saving") : t("edit_series_save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
