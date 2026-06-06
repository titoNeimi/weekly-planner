"use client";

import { useEffect, useState } from "react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import CategorySelect from "@/components/category-select";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

export default function EditTaskModal({
  task,
  categories,
  onClose,
  onSaved,
}: {
  task: SerializedTask;
  categories: SerializedCategory[];
  onClose: () => void;
  onSaved: (updated: SerializedTask) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [categoryId, setCategoryId] = useState(task.categoryId ?? "none");
  const [notes, setNotes] = useState(task.notes ?? "");
  const [hasDate, setHasDate] = useState(task.date !== null);
  const [date, setDate] = useState(task.date?.slice(0, 10) ?? "");
  const [time, setTime] = useState(task.date?.slice(11, 16) ?? "");
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
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/task/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        categoryId: categoryId === "none" ? null : categoryId,
        notes: notes.trim() || null,
        date: hasDate ? date || null : null,
        time: hasDate ? time || null : null,
      }),
    });
    const updated: SerializedTask = await res.json();
    setSaving(false);
    onSaved(updated);
    onClose();
    toast.success(t("task_updated"));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md mx-4 sm:mx-auto rounded-2xl bg-white p-4 sm:p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{t("edit_task_heading")}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{t("edit_task_label_title")}</label>
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                {t("edit_task_label_category")}
              </label>
              <CategorySelect
                value={categoryId}
                onChange={setCategoryId}
                categories={categories}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">{t("edit_task_label_date")}</label>
                <button
                  type="button"
                  onClick={() => setHasDate(!hasDate)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 transition"
                >
                  {hasDate ? t("add_task_no_date") : t("add_task_set_date")}
                </button>
              </div>
              {hasDate ? (
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
                />
              ) : (
                <div className="flex h-[38px] items-center rounded-lg border border-dashed border-gray-200 px-3 text-sm text-gray-400">
                  {t("no_date")}
                </div>
              )}
            </div>
          </div>

          {hasDate && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                {t("edit_task_label_time")}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{t("edit_task_label_notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 transition"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition"
            >
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
