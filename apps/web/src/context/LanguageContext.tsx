"use client";

import { createContext, useContext, useState, useEffect } from "react";
import en from "@/lib/i18n/en";
import es from "@/lib/i18n/es";
import type { Dict } from "@/lib/i18n/en";

type Lang = "en" | "es";

const DICTS: Record<Lang, Dict> = { en, es };

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof Dict) => string;
  ta: (key: keyof Dict) => string[];
  tpl: (key: keyof Dict, vars: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => String(en[key] ?? key),
  ta: (key) => (Array.isArray(en[key]) ? (en[key] as string[]) : []),
  tpl: (key, vars) => {
    let s = String(en[key] ?? key);
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  },
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const match = document.cookie.split(";").find((c) => c.trim().startsWith("lang="));
    if (match) {
      const val = match.split("=")[1]?.trim();
      if (val === "es" || val === "en") setLangState(val);
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    document.cookie = `lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }

  const dict = DICTS[lang];

  function t(key: keyof Dict): string {
    const val = dict[key];
    return typeof val === "string" ? val : String(en[key]);
  }

  function ta(key: keyof Dict): string[] {
    const val = dict[key];
    if (Array.isArray(val)) return val as string[];
    const fallback = en[key];
    return Array.isArray(fallback) ? (fallback as string[]) : [];
  }

  function tpl(key: keyof Dict, vars: Record<string, string | number>): string {
    let s = t(key);
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, ta, tpl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
