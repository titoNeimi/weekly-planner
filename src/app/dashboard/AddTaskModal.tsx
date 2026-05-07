"use client";

import { useEffect, useRef, useState } from "react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import { CATEGORY_COLORS, SWATCH_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import CategorySelect, { NEW_OPTION } from "@/components/category-select";
import { toast } from "sonner";

const NEW_CATEGORY_VALUE = NEW_OPTION;

export default function AddTaskModal({
  defaultDate,
  onClose,
  onSaved,
  categories,
  onCategoryCreated,
}: {
  defaultDate: Date;
  onClose: () => void;
  onSaved: (task: SerializedTask) => void;
  categories: SerializedCategory[];
  onCategoryCreated: (category: SerializedCategory) => void;
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "none");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(defaultDate.toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<
    "DAILY" | "WEEKLY" | "MONTHLY" | "ANNUAL"
  >("WEEKLY");
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [endCondition, setEndCondition] = useState<"date" | "count">("date");
  const [endDate, setEndDate] = useState("");
  const [endCount, setEndCount] = useState(4);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<CategoryColor>(CATEGORY_COLORS[0]);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleCategorySelect(value: string) {
    if (value === NEW_CATEGORY_VALUE) {
      setShowCreateForm(true);
    } else {
      setCategoryId(value);
      setShowCreateForm(false);
    }
  }

  function resolvedCategoryId(): string | null {
    if (categoryId === "none" || categoryId === "") return null;
    return categoryId;
  }

  async function handleCreateCategory() {
    if (!newName.trim()) return;
    setCreatingCategory(true);
    const res = await fetch("/api/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    const category: SerializedCategory = await res.json();
    setCreatingCategory(false);
    onCategoryCreated(category);
    setCategoryId(category.id);
    setShowCreateForm(false);
    setNewName("");
    setNewColor(CATEGORY_COLORS[0]);
    toast.success("Category created");
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (isRecurring && endCondition === "date" && !endDate) return;
    setSaving(true);

    const body: Record<string, unknown> = {
      title: title.trim(),
      categoryId: resolvedCategoryId(),
      notes: notes.trim() || null,
      date,
      time: time || null,
    };

    if (isRecurring) {
      body.recurringTask = {
        type: recurringType,
        interval: repeatInterval,
        endDate: endCondition === "date" ? endDate : undefined,
        endCount: endCondition === "count" ? endCount : undefined,
      };
    }

    const res = await fetch("/api/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const task: SerializedTask = await res.json();
    setSaving(false);
    onSaved(task);
    onClose();
    toast.success(isRecurring ? "Recurring task created" : "Task added");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md mx-4 sm:mx-auto rounded-2xl bg-white p-4 sm:p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Add task</h2>
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
              placeholder="What needs to be done?"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Category
              </label>
              <CategorySelect
                value={showCreateForm ? NEW_CATEGORY_VALUE : categoryId}
                onChange={handleCategorySelect}
                categories={categories}
                showNewOption
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

          {showCreateForm && (
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-medium text-gray-700">New category</p>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
              />
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`h-6 w-6 rounded-full transition ${SWATCH_CLASSES[color]} ${
                      newColor === color
                        ? "ring-2 ring-offset-1 ring-gray-600"
                        : ""
                    }`}
                    aria-label={color}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newName.trim() || creatingCategory}
                  onClick={handleCreateCategory}
                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition"
                >
                  {creatingCategory ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-600">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-gray-300"
              />
              Repeat this task
            </label>
          </div>

          {isRecurring && (
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 shrink-0">Every</span>
                <input
                  type="number"
                  min={1}
                  value={repeatInterval}
                  onChange={(e) =>
                    setRepeatInterval(Math.max(1, Number(e.target.value)))
                  }
                  className="w-14 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                />
                <select
                  value={recurringType}
                  onChange={(e) =>
                    setRecurringType(e.target.value as typeof recurringType)
                  }
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                >
                  <option value="DAILY">day(s)</option>
                  <option value="WEEKLY">week(s)</option>
                  <option value="MONTHLY">month(s)</option>
                  <option value="ANNUAL">year(s)</option>
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                  <input
                    type="radio"
                    name="endCondition"
                    checked={endCondition === "date"}
                    onChange={() => setEndCondition("date")}
                  />
                  Until date
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                  <input
                    type="radio"
                    name="endCondition"
                    checked={endCondition === "count"}
                    onChange={() => setEndCondition("count")}
                  />
                  After N times
                </label>
              </div>

              {endCondition === "date" ? (
                <input
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                  required={isRecurring}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={endCount}
                    onChange={(e) =>
                      setEndCount(Math.max(1, Number(e.target.value)))
                    }
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                  />
                  <span className="text-xs text-gray-500">times</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra details…"
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
              disabled={saving || showCreateForm}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {saving ? "Saving…" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
