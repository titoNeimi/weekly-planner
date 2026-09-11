"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { useLanguage } from "@/context/LanguageContext";

export default function SearchButton() {
  const { setOpen } = useSearch();
  const { t } = useLanguage();
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPod|iPad/.test(navigator.platform ?? navigator.userAgent));
  }, []);

  return (
    <button
      onClick={() => setOpen(true)}
      aria-label={t("search_open")}
      title={t("search_open")}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-gray-400 dark:text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
    >
      <Search size={15} />
      <span className="hidden text-xs text-gray-300 dark:text-gray-600 sm:inline">
        {isMac ? "⌘K" : "Ctrl K"}
      </span>
    </button>
  );
}
