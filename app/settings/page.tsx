"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Footer from "@/app/components/Footer";
import PageShell from "@/app/components/PageShell";

const alertTypeOptions = [
  "غارات / قصف مدفعي", "مسيّرات", "تهديدات", "تمركز العدو",
  "انتشار الجيش", "حوادث السير", "اشتباكات", "إصابات",
];

type UserSettings = {
  soundEnabled: boolean;
  urgentBar: boolean;
  highlightAreas: boolean;
  selectedArea: string;
  enabledAlertTypes: string[];
};

const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true, urgentBar: true, highlightAreas: true,
  selectedArea: "صور", enabledAlertTypes: [...alertTypeOptions],
};

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try { const s = localStorage.getItem("albayan-settings"); if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) }; } catch {}
  return DEFAULT_SETTINGS;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setSettings(loadSettings()); }, []);

  function updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleAlertType(type: string) {
    setSettings((prev) => {
      const enabled = prev.enabledAlertTypes.includes(type)
        ? prev.enabledAlertTypes.filter((t) => t !== type)
        : [...prev.enabledAlertTypes, type];
      return { ...prev, enabledAlertTypes: enabled };
    });
    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem("albayan-settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>الإعدادات</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">إعدادات الخريطة</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          خصّص تجربة استخدام AlBayan Alert Map، واختر طريقة عرض التنبيهات والمناطق المهمة.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
            <p className="font-bold mb-4 tracking-widest text-xs" style={{ color: "var(--accent)" }}>حالة النظام</p>
            <div className="space-y-5">
              <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  النظام يعمل
                </h3>
              </div>
              <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="font-bold">تغطية لبنان</h3>
                <p className="text-sm mt-2 leading-7" style={{ color: "var(--text-secondary)" }}>تغطية ميدانية حسب المناطق المتوفرة في الخريطة.</p>
              </div>
              <div><h3 className="font-bold">AlBayan Alert Map v1.0</h3></div>
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>روابط سريعة</p>
            <div className="space-y-3">
              <Link href="/faq" className="block rounded-xl px-4 py-3 font-bold transition hover:opacity-80" style={{ background: "var(--bg-card)" }}>الأسئلة الشائعة</Link>
              <Link href="/privacy" className="block rounded-xl px-4 py-3 font-bold transition hover:opacity-80" style={{ background: "var(--bg-card)" }}>سياسة الخصوصية</Link>
              <Link href="/terms" className="block rounded-xl px-4 py-3 font-bold transition hover:opacity-80" style={{ background: "var(--bg-card)" }}>الشروط والأحكام</Link>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-2 rounded-2xl p-6 md:p-8" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="text-center mb-8">
            <p className="font-bold mb-3 tracking-widest text-xs" style={{ color: "var(--accent)" }}>تفضيلات المستخدم</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">تخصيص تجربة الخريطة</h2>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-bold mb-4">المنطقة المفضلة</h3>
              <select value={settings.selectedArea} onChange={(e) => updateSetting("selectedArea", e.target.value)}
                className="w-full rounded-xl px-4 py-3 outline-none transition"
                style={{ background: "var(--bg-main)", border: "1px solid var(--border)", color: "var(--text)" }}>
                <option>صور</option><option>برج الشمالي</option><option>النبطية</option>
                <option>بنت جبيل</option><option>الخيام</option><option>كفركلا</option>
              </select>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-bold mb-4">أنواع التنبيهات</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertTypeOptions.map((item) => (
                  <label key={item} className="flex items-center gap-3 rounded-xl p-4 cursor-pointer transition hover:opacity-80"
                    style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
                    <input type="checkbox" checked={settings.enabledAlertTypes.includes(item)} onChange={() => toggleAlertType(item)} className="w-5 h-5 accent-[var(--accent)]" />
                    <span className="font-bold">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-bold mb-4">خيارات العرض</h3>
              <div className="space-y-3">
                <ToggleRow title="إظهار شريط الأخبار العاجلة" text="عرض التنبيه العاجل أعلى الخريطة عند وجود حدث مهم." enabled={settings.urgentBar} setEnabled={(v) => updateSetting("urgentBar", v)} />
                <ToggleRow title="إبراز المناطق المهددة" text="تلوين المنطقة بالكامل عند وجود تهديد أو تمركز." enabled={settings.highlightAreas} setEnabled={(v) => updateSetting("highlightAreas", v)} />
                <ToggleRow title="تشغيل صوت عند التنبيه" text="تنبيه صوتي عند وصول حدث عاجل جديد." enabled={settings.soundEnabled} setEnabled={(v) => updateSetting("soundEnabled", v)} />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <button onClick={handleSave} className={`flex-1 transition rounded-xl px-5 py-4 font-extrabold text-white ${saved ? "bg-green-600" : ""}`}
                style={saved ? {} : { background: "var(--accent)" }}>
                {saved ? "✓ تم الحفظ" : "حفظ الإعدادات"}
              </button>
              <Link href="/" className="flex-1 text-center rounded-xl px-5 py-4 font-extrabold transition"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                العودة للخريطة
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </PageShell>
  );
}

function ToggleRow({ title, text, enabled, setEnabled }: { title: string; text: string; enabled: boolean; setEnabled: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl p-4" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{text}</p>
      </div>
      <button onClick={() => setEnabled(!enabled)}
        className="w-12 h-7 rounded-full p-0.5 transition flex-shrink-0"
        style={{ background: enabled ? "var(--accent)" : "var(--border)" }}>
        <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow ${enabled ? "" : "translate-x-5"}`} />
      </button>
    </div>
  );
}
