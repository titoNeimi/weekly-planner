"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
});

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const match = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("theme="));
    const val = match?.split("=")[1]?.trim();
    if (val === "light" || val === "dark" || val === "system") {
      setThemeState(val);
      applyTheme(val);
    }
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      applyTheme("system");
    }
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    applyTheme(t);
    document.cookie = `theme=${t}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
