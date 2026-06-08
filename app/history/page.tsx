"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/app/lib/supabase";
import type { AlertItem } from "@/app/lib/types";
import { useApp } from "@/app/components/ThemeProvider";
import PageShell from "@/app/components/PageShell";
import Footer from "@/app/components/Footer";
import Link from "next/link";

const TYPE_COLORS: Record<string, string> = {
  strike: "#EF4444", artillery: "#DC2626", drone: "#5BA4E6",
  threat: "#F59E0B", enemy_position: "#A855F7", army_position: "#22C55E",
  traffic: "#38BDF8", crowd: "#DC2626", fire: "#F97316", injuries: "#E11D48",
  siren: "#E53935", siren_missile: "#E53935", siren_drone: "#E53935",
};

function cleanLabel(label: string) {
  return label.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, "").trim();
}

export default function HistoryPage() {
  const { t, lang } = useApp();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PER_PAGE = 50;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(500);
      setAlerts(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date().toISOString();
    return alerts.filter((a) => {
      if (statusFilter === "active" && a.expires_at && a.expires_at < now) return false;
      if (statusFilter === "expired" && (!a.expires_at || a.expires_at >= now)) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      return true;
    });
  }, [alerts, statusFilter, typeFilter]);

  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>{t("historyTitle")}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{t("historyTitle")}</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>{t("historyDesc")}</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {(["all", "active", "expired"] as const).map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
            className="px-4 py-2 rounded-lg text-xs font-bold transition"
            style={{ background: statusFilter === s ? "var(--accent)" : "var(--bg-card)", color: statusFilter === s ? "white" : "var(--text-secondary)", border: "1px solid var(--border)" }}>
            {s === "all" ? t("allAlerts") : s === "active" ? t("activeAlerts") : t("expiredAlerts")}
          </button>
        ))}
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="px-4 py-2 rounded-lg text-xs font-bold outline-none" style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)" }}>
          <option value="all">{t("all")}</option>
          <option value="strike">{t("strikes")}</option>
          <option value="drone">{t("drones")}</option>
          <option value="threat">{t("threats")}</option>
          <option value="siren">{t("sirens")}</option>
        </select>
      </div>

      <p className="text-center text-sm mb-4" style={{ color: "var(--text-muted)" }}>{filtered.length} {t("alertCount")}</p>

      {loading ? (
        <div className="text-center py-20"><div className="w-10 h-10 mx-auto rounded-full animate-spin" style={{ border: "3px solid var(--border)", borderTopColor: "var(--accent)" }} /></div>
      ) : paged.length === 0 ? (
        <p className="text-center py-20" style={{ color: "var(--text-muted)" }}>{t("noHistory")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
          {paged.map((alert) => {
            const color = TYPE_COLORS[alert.type] || "#5BA4E6";
            const isExpired = alert.expires_at && alert.expires_at < new Date().toISOString();
            return (
              <div key={alert.id} className="rounded-xl p-4 relative overflow-hidden transition" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", opacity: isExpired ? 0.6 : 1 }}>
                <div className="absolute top-0 right-0 bottom-0 w-[3px]" style={{ backgroundColor: color, borderRadius: lang === "ar" ? "0 8px 8px 0" : "8px 0 0 8px" }} />
                <div className={lang === "ar" ? "pr-3" : "pl-3"}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold" style={{ color }}>{cleanLabel(alert.type_label)}</span>
                    {isExpired && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>{t("expired")}</span>}
                  </div>
                  <div className="font-bold text-sm">{alert.area}</div>
                  {alert.description && <div className="text-[11px] mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{alert.description}</div>}
                  <div className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
                    {alert.created_at && new Date(alert.created_at).toLocaleString(lang === "ar" ? "ar-LB" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > PER_PAGE && (
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-30" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>←</button>
          <span className="px-4 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{page + 1} / {Math.ceil(filtered.length / PER_PAGE)}</span>
          <button onClick={() => setPage(Math.min(Math.ceil(filtered.length / PER_PAGE) - 1, page + 1))} disabled={(page + 1) * PER_PAGE >= filtered.length}
            className="px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-30" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>→</button>
        </div>
      )}
      <Footer />
    </PageShell>
  );
}
