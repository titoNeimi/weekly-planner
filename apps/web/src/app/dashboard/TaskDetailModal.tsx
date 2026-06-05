"use client";

import { useEffect, useState } from "react";
import { Pencil, Check } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { toast } from "sonner";
import type { SerializedTask } from "./WeekView";
import { useLanguage } from "@/context/LanguageContext";
import { COLOR_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";

function toggleNthCheckbox(text: string, targetIndex: number): string {
  let count = 0;
  return text.replace(/- \[([ xX])\]/g, (match, state) => {
    if (count++ === targetIndex) {
      return state === " " ? "- [x]" : "- [ ]";
    }
    return match;
  });
}

export default function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onToggle,
  onSaved,
}: {
  task: SerializedTask;
  onClose: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onSaved?: (updated: SerializedTask) => void;
}) {
  const [notes, setNotes] = useState(task.notes ?? "");
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

  async function handleCheckboxToggle(index: number) {
    const updated = toggleNthCheckbox(notes, index);
    setNotes(updated);
    try {
      const res = await fetch(`/api/task/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: updated || null }),
      });
      if (!res.ok) throw new Error();
      const savedTask: SerializedTask = await res.json();
      onSaved?.(savedTask);
    } catch {
      setNotes(notes);
      toast.error("Failed to save");
    }
  }

  const components: Components = {
    h1: ({ children }) => (
      <h1 className="mb-3 mt-6 text-lg font-bold text-gray-900 first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-2 mt-5 text-base font-semibold text-gray-900 first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-4 text-sm font-semibold text-gray-800 first:mt-0">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 text-sm leading-relaxed text-gray-700 last:mb-0">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-gray-700 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-gray-700 last:mb-0">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
    em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="mb-3 border-l-4 border-gray-300 pl-3 italic text-gray-500">{children}</blockquote>
    ),
    code: ({ className, children }) => {
      if (className) return <code className={className}>{children}</code>;
      return (
        <code className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs text-gray-800">{children}</code>
      );
    },
    pre: ({ children }) => (
      <pre className="mb-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs last:mb-0">{children}</pre>
    ),
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
        {children}
      </a>
    ),
    hr: () => <hr className="my-4 border-gray-200" />,
    input: ({ type, checked }) => {
      if (type !== "checkbox") return null;
      return (
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(e) => {
            const container = e.currentTarget.closest("[data-notes]");
            if (!container) return;
            const all = container.querySelectorAll('input[type="checkbox"]');
            const idx = Array.from(all).indexOf(e.currentTarget);
            if (idx !== -1) void handleCheckboxToggle(idx);
          }}
          className="mr-1.5 cursor-pointer align-middle"
        />
      );
    },
  };

  const categoryBadgeClass = task.category
    ? (COLOR_CLASSES[task.category.color as CategoryColor] ??
      "bg-gray-100 text-gray-500")
    : null;

  const timeUTC = task.date ? task.date.slice(11, 16) : null;
  const hasTime = timeUTC !== null && timeUTC !== "00:00";

  const dateLabel = task.date
    ? new Date(task.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <div
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                task.isEvent ? "bg-amber-400" : task.done ? "bg-gray-300" : "bg-gray-800"
              }`}
            />
            <h2
              className={`wrap-break-word text-base font-semibold leading-snug ${
                task.done ? "line-through text-gray-400" : "text-gray-900"
              }`}
            >
              {task.title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!task.isEvent && (
              <button
                onClick={onToggle}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                  task.done
                    ? "border-gray-200 text-gray-400 hover:bg-gray-50"
                    : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                <Check size={11} />
                {task.done ? t("task_detail_undo") : t("task_detail_done")}
              </button>
            )}
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition"
            >
              <Pencil size={11} />
              {t("task_detail_edit")}
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              aria-label={t("close")}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {dateLabel ? (
              <>
                <span>{dateLabel}</span>
                {hasTime && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                    {timeUTC}
                  </span>
                )}
              </>
            ) : (
              <span className="italic text-gray-400">{t("no_date")}</span>
            )}
          </div>

          {task.category && categoryBadgeClass && (
            <span
              className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium ${categoryBadgeClass}`}
            >
              {task.category.name}
            </span>
          )}

          {notes ? (
            <div
              data-notes="true"
              className="max-h-[60vh] overflow-y-auto rounded-lg bg-gray-50 px-4 py-3"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeHighlight]}
                components={components}
              >
                {notes}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs italic text-gray-400">{t("task_detail_no_notes")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
