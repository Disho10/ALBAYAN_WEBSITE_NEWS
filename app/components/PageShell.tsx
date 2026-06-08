"use client";

import Link from "next/link";
import { Sun, Moon, ArrowRight, ArrowLeft, Globe } from "lucide-react";
import { useApp } from "@/app/components/ThemeProvider";
import type { ReactNode } from "react";

export default function PageShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme, lang, toggleLang, t } = useApp();
  const Arrow = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <main className="min-h-screen p-6" style={{ background: "var(--bg-deep)", color: "var(--text)" }} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-2">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold transition hover:opacity-80" style={{ color: "var(--accent)" }}>
          <Arrow size={16} />
          {t("backToMap")}
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleLang} className="map-btn !w-8 !h-8 text-[10px] font-bold" title={lang === "ar" ? "English" : "عربي"}>
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <button onClick={toggleTheme} className="map-btn !w-8 !h-8" title={theme === "dark" ? t("lightMode") : t("darkMode")}>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <img src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"} alt="البيان" width={32} height={32} />
        </div>
      </div>
      <section className="max-w-6xl mx-auto">{children}</section>
    </main>
  );
}
