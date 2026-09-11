"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Pin } from "lucide-react";
import type { SerializedCategory } from "@/app/dashboard/WeekView";
import { SWATCH_CLASSES } from "@/lib/category-colors";
import type { CategoryColor } from "@/lib/category-colors";
import { sortCategories } from "@/lib/categories";
import { useLanguage } from "@/context/LanguageContext";

const NEW_OPTION = "__new__";

type Props = {
  value: string;
  onChange: (value: string) => void;
  categories: SerializedCategory[];
  showNewOption?: boolean;
};

export default function CategorySelect({
  value,
  onChange,
  categories,
  showNewOption = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const selected = categories.find((c) => c.id === value);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 hover:border-gray-300 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 transition"
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${SWATCH_CLASSES[selected.color as CategoryColor] ?? "bg-gray-300 dark:bg-gray-600"}`}
              />
              <span className="truncate text-gray-800 dark:text-gray-200">{selected.name}</span>
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">{t("cat_no_category")}</span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute z-[9999] mt-1 w-full rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg"
        >
          <li>
            <button
              type="button"
              onClick={() => handleSelect("none")}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                value === "none" || value === ""
                  ? "text-gray-900 dark:text-gray-100 font-medium"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-gray-300 dark:border-gray-600" />
              {t("cat_no_category")}
            </button>
          </li>
          {sortCategories(categories).map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => handleSelect(c.id)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  value === c.id ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${SWATCH_CLASSES[c.color as CategoryColor] ?? "bg-gray-300 dark:bg-gray-600"}`}
                />
                <span className="min-w-0 flex-1 truncate text-left">{c.name}</span>
                {c.pinned && <Pin size={11} className="shrink-0 text-gray-300 dark:text-gray-600" />}
              </button>
            </li>
          ))}
          {showNewOption && (
            <li>
              <button
                type="button"
                onClick={() => handleSelect(NEW_OPTION)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition border-t border-gray-100 dark:border-gray-800 mt-1"
              >
                {t("cat_new")}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export { NEW_OPTION };
