"use client";

import Link from "next/link";
import { useApp } from "@/app/components/ThemeProvider";

export default function Footer() {
  const { t } = useApp();
  return (
    <footer dir="ltr" className="mt-16 pt-6 pb-6 text-center text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/faq" className="hover:opacity-80 transition">{t("faq")}</Link>
        <span style={{ color: "var(--border)" }}>·</span>
        <Link href="/terms" className="hover:opacity-80 transition">{t("terms")}</Link>
        <span style={{ color: "var(--border)" }}>·</span>
        <Link href="/privacy" className="hover:opacity-80 transition">{t("privacy")}</Link>
        <span style={{ color: "var(--border)" }}>·</span>
        <Link href="/history" className="hover:opacity-80 transition">History</Link>
        <span style={{ color: "var(--border)" }}>·</span>
        <Link href="/stats" className="hover:opacity-80 transition">Stats</Link>
        <span style={{ color: "var(--border)" }}>·</span>
        <Link href="/about" className="hover:opacity-80 transition">About</Link>
        <span style={{ color: "var(--border)" }}>·</span>
        <span>© {new Date().getFullYear()} {t("footerCopyright")}</span>
      </div>
    </footer>
  );
}
