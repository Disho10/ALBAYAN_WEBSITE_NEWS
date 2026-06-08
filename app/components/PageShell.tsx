"use client";

import Link from "next/link";
import Image from "next/image";
import { Sun, Moon, ArrowRight } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";
import type { ReactNode } from "react";

export default function PageShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="min-h-screen p-6" style={{ background: "var(--bg-deep)", color: "var(--text)" }} dir="rtl">
      {/* Top bar */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-2">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
          style={{ color: "var(--accent)" }}
        >
          <ArrowRight size={16} />
          العودة للخريطة
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="map-btn !w-8 !h-8"
            title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <Image src="/new_logo.jpg" alt="البيان" width={32} height={32} className="rounded-lg" />
        </div>
      </div>
      <section className="max-w-6xl mx-auto">
        {children}
      </section>
    </main>
  );
}
