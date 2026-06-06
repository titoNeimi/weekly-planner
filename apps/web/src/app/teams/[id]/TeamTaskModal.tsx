"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { TeamCategoryData } from "./TeamCategoriesSection";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalTodayStr } from "@/lib/date";

export type TeamTaskData = {
  id: string;
  title: string;
  notes: string | null;
  date: string | null;
  done: boolean;
  isEvent: boolean;
  teamCategoryId: string | null;
  assignedToId: string | null;
  createdByUserId: string;
};

type MemberOption = {
  id: string;
  name: string | null;
};

export default function TeamTaskModal({
  teamId,
  members,
  categories,
  task,
  onClose,
  onSaved,
}: {
  teamId: string;
  members: MemberOption[];
  categories: TeamCategoryData[];
  task?: TeamTaskData;
  onClose: () => void;
  onSaved: (task: TeamTaskData) => void;
}) {
  const { t } = useLanguage();
  const today = getLocalTodayStr();
  const [isEvent, setIsEvent] = useState(task?.isEvent ?? false);
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [hasDate, setHasDate] = useState(task ? task.date !== null : true);
  const [date, setDate] = useState(task?.date?.slice(0, 10) ?? today);
  const [assignedToId, setAssignedToId] = useState(task?.assignedToId ?? "");
  const [teamCategoryId, setTeamCategoryId] = useState(task?.teamCategoryId ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    try {
      const url = task
        ? `/api/team/${teamId}/task/${task.id}`
        : `/api/team/${teamId}/task`;
      const res = await fetch(url, {
        method: task ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          notes: notes.trim() || null,
          date: hasDate ? date : null,
          assignedToId: assignedToId || null,
          teamCategoryId: teamCategoryId || null,
          isEvent,
        }),
      });
      if (!res.ok) throw new Error();
      onSaved(await res.json());
      onClose();
      toast.success(task ? t("task_updated") : isEvent ? t("team_task_event_added") : t("task_added"));
    } catch {
      toast.error(task ? "Failed to update task" : "Failed to add task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {task
              ? isEvent ? t("team_task_edit_event_heading") : t("team_task_edit_heading")
              : isEvent ? t("team_task_add_event_heading") : t("team_task_add_heading")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!task && (
            <div className="flex rounded-lg border border-gray-200 p-0.5">
              <button
                type="button"
                onClick={() => setIsEvent(false)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                  !isEvent ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("team_task_type_task")}
              </button>
              <button
                type="button"
                onClick={() => setIsEvent(true)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                  isEvent ? "bg-amber-500 text-white" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("team_task_type_event")}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{t("team_task_label_title")}</label>
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isEvent ? t("team_task_event_title_placeholder") : t("team_task_title_placeholder")}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">{t("team_task_label_date")}</label>
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
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                />
              ) : (
                <div className="flex h-[38px] items-center rounded-lg border border-dashed border-gray-200 px-3 text-sm text-gray-400">
                  {t("no_date")}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                {t("team_task_label_assign")}
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
              >
                <option value="">{t("team_task_unassigned")}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? t("team_task_unknown")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              {t("team_task_label_category")}
            </label>
            <select
              value={teamCategoryId}
              onChange={(e) => setTeamCategoryId(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
            >
              <option value="">{t("team_task_no_category")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              {t("team_task_label_notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("team_task_notes_placeholder")}
              rows={3}
              className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-100"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? t("saving") : task ? t("save") : t("team_task_add_heading")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
