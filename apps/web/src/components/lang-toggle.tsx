"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LangToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100 transition cursor-pointer"
      title={lang === "en" ? "Cambiar a español" : "Switch to English"}
    >
      {lang === "en" ? "ES" : "EN"}
    </button>
  );
}
