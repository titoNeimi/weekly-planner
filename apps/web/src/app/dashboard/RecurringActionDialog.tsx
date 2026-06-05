"use client";

import { useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function RecurringActionDialog({
  action,
  onThisOne,
  onAll,
  onClose,
}: {
  action: "edit" | "delete";
  onThisOne: () => void;
  onAll: () => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-center gap-2">
          <RefreshCcw size={13} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">
            {t("recurring_title")}
          </h2>
        </div>
        <p className="mb-5 text-xs text-gray-500">
          {action === "edit" ? t("recurring_edit_q") : t("recurring_delete_q")}
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onThisOne}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <span className="font-medium">{t("recurring_this")}</span>
            <span className="ml-1.5 text-gray-400">{t("recurring_this_note")}</span>
          </button>
          <button
            onClick={onAll}
            className={`rounded-lg border px-4 py-2.5 text-left text-sm transition ${
              action === "delete"
                ? "border-red-100 text-red-600 hover:bg-red-50"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="font-medium">
              {action === "edit" ? t("recurring_all") : t("recurring_cancel_series")}
            </span>
            <span
              className={`ml-1.5 ${action === "delete" ? "text-red-300" : "text-gray-400"}`}
            >
              {t("recurring_all_note")}
            </span>
          </button>
          <button
            onClick={onClose}
            className="mt-1 rounded-lg px-4 py-2 text-center text-sm text-gray-400 hover:bg-gray-50 transition"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
