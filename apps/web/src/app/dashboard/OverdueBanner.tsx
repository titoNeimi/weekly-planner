"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function OverdueBanner({
  count,
  onRescheduleAll,
}: {
  count: number;
  onRescheduleAll: () => Promise<void>;
}) {
  const { t, tpl } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  if (dismissed || count === 0) return null;

  async function handleReschedule() {
    setRescheduling(true);
    try {
      await onRescheduleAll();
    } finally {
      setRescheduling(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
      <p className="text-sm text-amber-800">
        {tpl("overdue_banner_message", { n: count })}
      </p>
      <div className="flex shrink-0 items-center gap-4">
        <button
          onClick={handleReschedule}
          disabled={rescheduling}
          className="text-sm font-medium text-amber-800 underline decoration-amber-400 underline-offset-2 transition hover:text-amber-900 disabled:opacity-50"
        >
          {rescheduling ? t("overdue_banner_moving") : t("overdue_banner_action")}
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label={t("close")}
          className="text-amber-400 transition hover:text-amber-600"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
