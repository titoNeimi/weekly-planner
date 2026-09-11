"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CalendarClock, Copy, Trash2 } from "lucide-react";
import { getLocalTodayStr, addDaysToDateStr } from "@/lib/date";
import { useLanguage } from "@/context/LanguageContext";

export default function TaskContextMenu({
  x,
  y,
  onDuplicate,
  onReschedule,
  onDelete,
  onClose,
}: {
  x: number;
  y: number;
  onDuplicate: () => void;
  onReschedule: (dateStr: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Clamp to viewport so the menu never overflows off-screen
  const menuW = 200;
  const menuH = rescheduling ? 190 : 96;
  const left = Math.min(x, window.innerWidth - menuW - 8);
  const top = Math.min(y, window.innerHeight - menuH - 8);

  const today = getLocalTodayStr();

  function pick(dateStr: string) {
    onReschedule(dateStr);
    onClose();
  }

  return createPortal(
    <div
      ref={ref}
      style={{ left, top }}
      className="fixed z-50 min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1 shadow-lg"
    >
      {!rescheduling ? (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
              onClose();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Copy size={13} className="shrink-0 text-gray-400 dark:text-gray-500" />
            {t("task_duplicate")}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRescheduling(true);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <CalendarClock size={13} className="shrink-0 text-gray-400 dark:text-gray-500" />
            {t("task_reschedule")}
          </button>
          <div className="mx-2 border-t border-gray-100 dark:border-gray-800" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              onClose();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 transition"
          >
            <Trash2 size={13} className="shrink-0" />
            {t("task_delete")}
          </button>
        </>
      ) : (
        <div className="px-2 py-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRescheduling(false);
            }}
            aria-label={t("task_reschedule_back")}
            className="mb-1.5 flex items-center gap-1.5 rounded px-1 py-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition"
          >
            <ArrowLeft size={12} />
            {t("task_reschedule")}
          </button>
          <div className="flex flex-col gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                pick(today);
              }}
              className="rounded-md px-2 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {t("task_reschedule_today")}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                pick(addDaysToDateStr(today, 1));
              }}
              className="rounded-md px-2 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {t("task_reschedule_tomorrow")}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                pick(addDaysToDateStr(today, 7));
              }}
              className="rounded-md px-2 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {t("task_reschedule_next_week")}
            </button>
            <input
              type="date"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (e.target.value) pick(e.target.value);
              }}
              className="mt-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
            />
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
