"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/app/lib/supabase";
import type { AlertItem } from "@/app/lib/types";
import { useApp } from "@/app/components/ThemeProvider";
import PageShell from "@/app/components/PageShell";
import Footer from "@/app/components/Footer";

const TYPE_COLORS: Record<string, string> = {
  strike: "#EF4444", artillery: "#DC2626", drone: "#5BA4E6",
  threat: "#F59E0B", enemy_position: "#A855F7", army_position: "#22C55E",
  traffic: "#38BDF8", crowd: "#DC2626", fire: "#F97316", injuries: "#E11D48",
  siren: "#E53935", siren_missile: "#E53935", siren_drone: "#E53935",
};

const TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  strike: { ar: "غارات", en: "Strikes" }, artillery: { ar: "قصف مدفعي", en: "Artillery" },
  drone: { ar: "مسيّرات", en: "Drones" }, threat: { ar: "تهديدات", en: "Threats" },
  enemy_position: { ar: "تمركز العدو", en: "Enemy pos." }, army_position: { ar: "الجيش", en: "Army" },
  traffic: { ar: "حوادث", en: "Accidents" }, crowd: { ar: "اشتباكات", en: "Clashes" },
  fire: { ar: "حرائق", en: "Fires" }, injuries: { ar: "إصابات", en: "Injuries" },
  siren: { ar: "صافرات", en: "Sirens" }, siren_missile: { ar: "صاروخ", en: "Missile" }, siren_drone: { ar: "مسيّرة", en: "Drone siren" },
};

export default function StatsPage() {
  const { t, lang } = useApp();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(2000);
      setAlerts(data || []);
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const active = useMemo(() => alerts.filter((a) => a.status === "active" && (!a.expires_at || new Date(a.expires_at) > now)), [alerts]);
  const urgentNow = useMemo(() => active.filter((a) => a.is_urgent), [active]);
  const last7d = useMemo(() => {
    const cutoff = new Date(now.getTime() - 7 * 86400000).toISOString();
    return alerts.filter((a) => a.created_at && a.created_at >= cutoff);
  }, [alerts]);

  // By type
  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of alerts) map[a.type] = (map[a.type] || 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [alerts]);
  const maxTypeCount = byType.length ? byType[0][1] : 1;

  // By area (top 15)
  const byArea = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of alerts) map[a.area] = (map[a.area] || 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [alerts]);
  const maxAreaCount = byArea.length ? byArea[0][1] : 1;

  // Daily (last 7 days)
  const daily = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      days[d.toISOString().split("T")[0]] = 0;
    }
    for (const a of last7d) {
      if (a.created_at) {
        const day = a.created_at.split("T")[0];
        if (day in days) days[day]++;
      }
    }
    return Object.entries(days);
  }, [last7d]);
  const maxDaily = Math.max(...daily.map(([, v]) => v), 1);

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>{t("statsTitle")}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{t("statsTitle")}</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>{t("statsDesc")}</p>
      </div>

      {loading ? (
        <div className="text-center py-20"><div className="w-10 h-10 mx-auto rounded-full animate-spin" style={{ border: "3px solid var(--border)", borderTopColor: "var(--accent)" }} /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-4xl mx-auto">
            {[
              { label: t("totalAlerts"), value: alerts.length, color: "var(--blue)" },
              { label: t("activeNow"), value: active.length, color: "var(--green)" },
              { label: t("urgentNow"), value: urgentNow.length, color: "var(--accent)" },
              { label: t("last7Days"), value: last7d.length, color: "#F59E0B" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
                <div className="text-3xl font-extrabold mb-1" style={{ color: card.color }}>{card.value}</div>
                <div className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Daily activity - last 7 days */}
          <div className="rounded-2xl p-6 mb-6 max-w-4xl mx-auto" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
            <h2 className="font-bold mb-4">{t("last7Days")}</h2>
            <div className="flex items-end gap-2 h-40">
              {daily.map(([day, count]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>{count}</span>
                  <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max((count / maxDaily) * 100, 4)}%`, background: "var(--accent)" }} />
                  <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{day.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* By type */}
            <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
              <h2 className="font-bold mb-4">{t("byType")}</h2>
              <div className="space-y-2">
                {byType.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[type] || "#888" }} />
                    <span className="text-xs font-bold w-20 flex-shrink-0">{TYPE_LABELS[type]?.[lang] || type}</span>
                    <div className="flex-1 rounded-full h-5 overflow-hidden" style={{ background: "var(--bg-card)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxTypeCount) * 100}%`, background: TYPE_COLORS[type] || "#888" }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-left" style={{ color: "var(--text-muted)" }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By area */}
            <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
              <h2 className="font-bold mb-4">{t("byArea")}</h2>
              <div className="space-y-2">
                {byArea.map(([area, count]) => (
                  <div key={area} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-24 flex-shrink-0 truncate">{area}</span>
                    <div className="flex-1 rounded-full h-5 overflow-hidden" style={{ background: "var(--bg-card)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxAreaCount) * 100}%`, background: "var(--blue)" }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-left" style={{ color: "var(--text-muted)" }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      <Footer />
    </PageShell>
  );
}
