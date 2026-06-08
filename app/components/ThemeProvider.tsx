"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Lang, TKey } from "@/app/lib/i18n";
import { tr } from "@/app/lib/i18n";

type Theme = "dark" | "light";

interface AppContextValue {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  toggleLang: () => void;
  t: (key: TKey) => string;
}

const AppContext = createContext<AppContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  lang: "ar",
  toggleLang: () => {},
  t: (key) => key,
});

export function useTheme() { return useContext(AppContext); }
export function useApp() { return useContext(AppContext); }

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("ar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem("albayan-theme") as Theme | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      }
      const savedLang = localStorage.getItem("albayan-lang") as Lang | null;
      if (savedLang === "ar" || savedLang === "en") {
        setLang(savedLang);
        document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = savedLang;
      }
    } catch {}
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("albayan-theme", next); } catch {}
  }

  function toggleLang() {
    const next = lang === "ar" ? "en" : "ar";
    setLang(next);
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = next;
    try { localStorage.setItem("albayan-lang", next); } catch {}
  }

  const t = useCallback((key: TKey) => tr(key, lang), [lang]);

  useEffect(() => {
    if (mounted) document.documentElement.setAttribute("data-theme", theme);
  }, [theme, mounted]);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, lang, toggleLang, t }}>
      {children}
    </AppContext.Provider>
  );
}
