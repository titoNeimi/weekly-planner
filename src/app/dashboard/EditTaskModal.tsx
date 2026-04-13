"use client";

import { useEffect, useState } from "react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import CategorySelect from "@/components/category-select";

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
  const [date, setDate] = useState(task.date.slice(0, 10));
  const [time, setTime] = useState(task.date.slice(11, 16));
  const [saving, setSaving] = useState(false);

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
        date,
        time: time || null,
      }),
    });
    const updated: SerializedTask = await res.json();
    setSaving(false);
    onSaved(updated);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md mx-4 sm:mx-auto rounded-2xl bg-white p-4 sm:p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Edit task</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Title</label>
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Category
              </label>
              <CategorySelect
                value={categoryId}
                onChange={setCategoryId}
                categories={categories}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Time <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
