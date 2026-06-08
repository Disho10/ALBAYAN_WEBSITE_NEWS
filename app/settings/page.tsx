"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Footer from "@/app/components/Footer";
import PageShell from "@/app/components/PageShell";
import { useApp } from "@/app/components/ThemeProvider";

const alertTypeOptions = [
  "غارات / قصف مدفعي", "مسيّرات", "تهديدات", "تمركز العدو",
  "انتشار الجيش", "حوادث السير", "اشتباكات", "إصابات",
];

type UserSettings = {
  soundEnabled: boolean; urgentBar: boolean; highlightAreas: boolean;
  selectedArea: string; enabledAlertTypes: string[]; soundType: string;
};
const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true, urgentBar: true, highlightAreas: true,
  selectedArea: "صور", enabledAlertTypes: [...alertTypeOptions], soundType: "beep",
};

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try { const s = localStorage.getItem("albayan-settings"); if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) }; } catch {}
  return DEFAULT_SETTINGS;
}

export default function SettingsPage() {
  const { t } = useApp();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [notifStatus, setNotifStatus] = useState<"default" | "granted" | "denied">("default");

  useEffect(() => {
    setSettings(loadSettings());
    if (typeof Notification !== "undefined") setNotifStatus(Notification.permission as any);
  }, []);

  function update<K extends keyof UserSettings>(key: K, value: UserSettings[K]) { setSettings((p) => ({ ...p, [key]: value })); setSaved(false); }
  function toggleType(type: string) { setSettings((p) => { const e = p.enabledAlertTypes.includes(type) ? p.enabledAlertTypes.filter((t) => t !== type) : [...p.enabledAlertTypes, type]; return { ...p, enabledAlertTypes: e }; }); setSaved(false); }
  function handleSave() { localStorage.setItem("albayan-settings", JSON.stringify(settings)); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  async function requestNotif() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifStatus(perm as any);
    if (perm === "granted") new Notification(t("siteName"), { body: t("notifEnabled"), icon: "/new_logo.jpg" });
  }

  function previewSound(type: string) {
    try {
      const ctx = new AudioContext();
      if (type === "alarm") { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 800; o.type = "sawtooth"; g.gain.value = 0.08; o.start(); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); o.stop(ctx.currentTime + 0.3); }
      else if (type === "chime") { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 523; o.type = "sine"; g.gain.value = 0.1; o.start(); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); o.stop(ctx.currentTime + 0.4); }
      else { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; o.type = "sine"; g.gain.value = 0.12; o.start(); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); o.stop(ctx.currentTime + 0.5); }
    } catch {}
  }

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>{t("settings")}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{t("settingsTitle")}</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>{t("customizeMap")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
            <p className="font-bold mb-4 tracking-widest text-xs" style={{ color: "var(--accent)" }}>{t("systemStatus")}</p>
            <div className="space-y-5">
              <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="font-bold flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />{t("systemOnline")}</h3>
              </div>
              <div><h3 className="font-bold">AlBayan Alert Map v2.0</h3></div>
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>{t("quickLinks")}</p>
            <div className="space-y-3">
              <Link href="/faq" className="block rounded-xl px-4 py-3 font-bold transition hover:opacity-80" style={{ background: "var(--bg-card)" }}>{t("faq")}</Link>
              <Link href="/privacy" className="block rounded-xl px-4 py-3 font-bold transition hover:opacity-80" style={{ background: "var(--bg-card)" }}>{t("privacy")}</Link>
              <Link href="/terms" className="block rounded-xl px-4 py-3 font-bold transition hover:opacity-80" style={{ background: "var(--bg-card)" }}>{t("terms")}</Link>
              <Link href="/about" className="block rounded-xl px-4 py-3 font-bold transition hover:opacity-80" style={{ background: "var(--bg-card)" }}>About</Link>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-2 rounded-2xl p-6 md:p-8" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="text-center mb-8">
            <p className="font-bold mb-3 tracking-widest text-xs" style={{ color: "var(--accent)" }}>{t("preferences")}</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("customizeMap")}</h2>
          </div>

          <div className="space-y-6">
            {/* Preferred area */}
            <Section title={t("preferredArea")}>
              <select value={settings.selectedArea} onChange={(e) => update("selectedArea", e.target.value)}
                className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", color: "var(--text)" }}>
                <option>صور</option><option>برج الشمالي</option><option>النبطية</option><option>بنت جبيل</option><option>الخيام</option><option>كفركلا</option>
              </select>
            </Section>

            {/* Alert types */}
            <Section title={t("alertTypes")}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertTypeOptions.map((item) => (
                  <label key={item} className="flex items-center gap-3 rounded-xl p-4 cursor-pointer transition hover:opacity-80" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
                    <input type="checkbox" checked={settings.enabledAlertTypes.includes(item)} onChange={() => toggleType(item)} className="w-5 h-5 accent-[var(--accent)]" />
                    <span className="font-bold">{item}</span>
                  </label>
                ))}
              </div>
            </Section>

            {/* Display options */}
            <Section title={t("displayOptions")}>
              <div className="space-y-3">
                <ToggleRow title={t("urgentBarToggle")} text={t("urgentBarDesc")} enabled={settings.urgentBar} setEnabled={(v) => update("urgentBar", v)} />
                <ToggleRow title={t("highlightToggle")} text={t("highlightDesc")} enabled={settings.highlightAreas} setEnabled={(v) => update("highlightAreas", v)} />
                <ToggleRow title={t("soundToggle")} text={t("soundDesc")} enabled={settings.soundEnabled} setEnabled={(v) => update("soundEnabled", v)} />
              </div>
            </Section>

            {/* Sound type */}
            {settings.soundEnabled && (
              <Section title={t("soundType")}>
                <div className="grid grid-cols-3 gap-3">
                  {(["beep", "alarm", "chime"] as const).map((s) => (
                    <button key={s} onClick={() => { update("soundType", s); previewSound(s); }}
                      className="rounded-xl p-4 text-center font-bold transition"
                      style={{ background: settings.soundType === s ? "var(--accent)" : "var(--bg-main)", color: settings.soundType === s ? "white" : "var(--text-secondary)", border: "1px solid var(--border)" }}>
                      {t(s === "beep" ? "soundBeep" : s === "alarm" ? "soundAlarm" : "soundChime")}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* Notifications */}
            <Section title={t("notifications")}>
              <div className="rounded-xl p-4" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold mb-1">{t("enableNotifications")}</h4>
                    <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{t("notifDesc")}</p>
                  </div>
                  {notifStatus === "granted" ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "var(--green-soft)", color: "var(--green)" }}>✓</span>
                  ) : notifStatus === "denied" ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{t("notifBlocked")}</span>
                  ) : (
                    <button onClick={requestNotif} className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: "var(--blue)" }}>{t("enableNotifications")}</button>
                  )}
                </div>
              </div>
            </Section>

            {/* Keyboard shortcuts info */}
            <Section title={t("shortcuts")}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {[["S", "Search"], ["F", "Filter"], ["L", "Locate"], ["+", "Zoom in"], ["-", "Zoom out"], ["Esc", "Close"]].map(([key, action]) => (
                  <div key={key} className="flex items-center gap-2 rounded-xl p-3" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
                    <kbd className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>{key}</kbd>
                    <span style={{ color: "var(--text-secondary)" }}>{action}</span>
                  </div>
                ))}
              </div>
            </Section>

            <div className="flex flex-col md:flex-row gap-3">
              <button onClick={handleSave} className={`flex-1 transition rounded-xl px-5 py-4 font-extrabold text-white ${saved ? "bg-green-600" : ""}`} style={saved ? {} : { background: "var(--accent)" }}>
                {saved ? t("saved") : t("saveSettings")}
              </button>
              <Link href="/" className="flex-1 text-center rounded-xl px-5 py-4 font-extrabold transition" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>{t("backToMap")}</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ToggleRow({ title, text, enabled, setEnabled }: { title: string; text: string; enabled: boolean; setEnabled: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl p-4" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
      <div><h4 className="font-bold mb-1">{title}</h4><p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{text}</p></div>
      <button onClick={() => setEnabled(!enabled)} className="w-12 h-7 rounded-full p-0.5 transition flex-shrink-0" style={{ background: enabled ? "var(--accent)" : "var(--border)" }}>
        <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow ${enabled ? "" : "translate-x-5"}`} />
      </button>
    </div>
  );
}
