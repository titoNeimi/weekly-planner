"use client";

import { useEffect, useRef, useState } from "react";
import type { SerializedTask, SerializedCategory } from "./WeekView";
import { CATEGORY_COLORS, SWATCH_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import CategorySelect, { NEW_OPTION } from "@/components/category-select";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

const NEW_CATEGORY_VALUE = NEW_OPTION;

export default function AddTaskModal({
  defaultDate,
  defaultTime,
  onClose,
  onSaved,
  categories,
  onCategoryCreated,
}: {
  defaultDate: Date;
  defaultTime?: string;
  onClose: () => void;
  onSaved: (task: SerializedTask) => void;
  categories: SerializedCategory[];
  onCategoryCreated: (category: SerializedCategory) => void;
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "none");
  const [notes, setNotes] = useState("");
  const [hasDate, setHasDate] = useState(true);
  const [date, setDate] = useState(
    `${defaultDate.getUTCFullYear()}-${String(defaultDate.getUTCMonth() + 1).padStart(2, "0")}-${String(defaultDate.getUTCDate()).padStart(2, "0")}`,
  );
  const [time, setTime] = useState(
    () => defaultTime ?? `${String(new Date().getHours()).padStart(2, "0")}:00`,
  );
  const [saving, setSaving] = useState(false);

  const [isEvent, setIsEvent] = useState(false);
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
  const { t } = useLanguage();

  const dialogRef = useRef<HTMLDivElement>(null);

  function handleBackdrop(e: React.MouseEvent) {
    e.stopPropagation();
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
    toast.success(t("cat_created"));
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
      date: hasDate ? date : null,
      time: hasDate ? time || null : null,
      isEvent,
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
    toast.success(
      isEvent ? t("task_event_added") : isRecurring ? t("task_recurring_created") : t("task_added"),
    );
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
          <h2 className="text-base font-semibold text-gray-900">
            {isEvent ? t("add_task_event_heading") : t("add_task_heading")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex rounded-lg border border-gray-200 p-0.5">
          <button
            type="button"
            onClick={() => setIsEvent(false)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              !isEvent ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("add_task_type_task")}
          </button>
          <button
            type="button"
            onClick={() => setIsEvent(true)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              isEvent ? "bg-amber-500 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("add_task_type_event")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{t("add_task_label_title")}</label>
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isEvent ? t("add_task_event_title_placeholder") : t("add_task_title_placeholder")}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                {t("add_task_label_category")}
              </label>
              <CategorySelect
                value={showCreateForm ? NEW_CATEGORY_VALUE : categoryId}
                onChange={handleCategorySelect}
                categories={categories}
                showNewOption
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">{t("add_task_label_date")}</label>
                <button
                  type="button"
                  onClick={() => { setHasDate(!hasDate); if (hasDate) setIsRecurring(false); }}
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
                {t("add_task_label_time")}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
              />
            </div>
          )}

          {showCreateForm && (
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-medium text-gray-700">{t("add_task_new_category")}</p>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("add_task_category_name")}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
              />
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`h-6 w-6 rounded-full transition ${SWATCH_CLASSES[color]} ${
                      newColor === color
                        ? "ring-2 ring-offset-1 ring-primary"
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
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  disabled={!newName.trim() || creatingCategory}
                  onClick={handleCreateCategory}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition"
                >
                  {creatingCategory ? t("creating") : t("create")}
                </button>
              </div>
            </div>
          )}

          {hasDate && !isEvent && (
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-gray-300"
                />
                {t("add_task_repeat")}
              </label>
            </div>
          )}

          {isRecurring && (
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 shrink-0">{t("add_task_every")}</span>
                <input
                  type="number"
                  min={1}
                  value={repeatInterval}
                  onChange={(e) =>
                    setRepeatInterval(Math.max(1, Number(e.target.value)))
                  }
                  className="w-14 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
                />
                <select
                  value={recurringType}
                  onChange={(e) =>
                    setRecurringType(e.target.value as typeof recurringType)
                  }
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
                >
                  <option value="DAILY">{t("add_task_days")}</option>
                  <option value="WEEKLY">{t("add_task_weeks")}</option>
                  <option value="MONTHLY">{t("add_task_months")}</option>
                  <option value="ANNUAL">{t("add_task_years")}</option>
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
                  {t("add_task_until_date")}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                  <input
                    type="radio"
                    name="endCondition"
                    checked={endCondition === "count"}
                    onChange={() => setEndCondition("count")}
                  />
                  {t("add_task_after_n")}
                </label>
              </div>

              {endCondition === "date" ? (
                <input
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                  required={isRecurring}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
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
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
                  />
                  <span className="text-xs text-gray-500">{t("add_task_times")}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{t("add_task_label_notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("add_task_notes_placeholder")}
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
              disabled={saving || showCreateForm}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition"
            >
              {saving ? t("saving") : isEvent ? t("add_task_event_heading") : t("add_task_heading")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
