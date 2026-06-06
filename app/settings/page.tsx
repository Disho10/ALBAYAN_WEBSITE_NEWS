"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Footer from "@/app/components/Footer";

const alertTypeOptions = [
  "غارات / قصف مدفعي",
  "مسيّرات",
  "تهديدات",
  "تمركز العدو",
  "انتشار الجيش",
  "حوادث السير",
  "اشتباكات",
  "إصابات",
];

type UserSettings = {
  soundEnabled: boolean;
  urgentBar: boolean;
  highlightAreas: boolean;
  selectedArea: string;
  enabledAlertTypes: string[];
};

const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  urgentBar: true,
  highlightAreas: true,
  selectedArea: "صور",
  enabledAlertTypes: [...alertTypeOptions],
};

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem("albayan-settings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

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
    <main className="min-h-screen bg-[#00152D] text-white p-6" dir="rtl">
      <section className="max-w-6xl mx-auto">
        <Link href="/" className="text-[#3B82F6] font-bold hover:text-white transition">
          العودة للخريطة
        </Link>

        <div className="mt-10 mb-10 text-center">
          <p className="text-red-400 font-bold mb-3 tracking-widest">— الإعدادات</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">إعدادات الخريطة</h1>
          <p className="text-slate-300 leading-8 max-w-3xl mx-auto">
            خصّص تجربة استخدام AlBayan Alert Map، واختر طريقة عرض التنبيهات والمناطق المهمة.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-[#021B3A] border border-[#134B78] rounded-3xl p-6">
              <p className="text-red-400 font-bold mb-4 tracking-widest">حالة النظام</p>
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    النظام يعمل
                  </h3>
                </div>
                <div className="border-b border-white/10 pb-4">
                  <h3 className="font-bold">تغطية لبنان</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-7">تغطية ميدانية حسب المناطق المتوفرة في الخريطة.</p>
                </div>
                <div>
                  <h3 className="font-bold">AlBayan Alert Map v1.0</h3>
                </div>
              </div>
            </div>

            <div className="bg-[#0A3563] border border-[#134B78] rounded-3xl p-6">
              <p className="text-slate-400 text-xs font-bold tracking-widest mb-3">روابط سريعة</p>
              <div className="space-y-3">
                <Link href="/faq" className="block bg-[#021B3A] hover:bg-[#134B78] transition rounded-xl px-4 py-3 font-bold">الأسئلة الشائعة</Link>
                <Link href="/privacy" className="block bg-[#021B3A] hover:bg-[#134B78] transition rounded-xl px-4 py-3 font-bold">سياسة الخصوصية</Link>
                <Link href="/terms" className="block bg-[#021B3A] hover:bg-[#134B78] transition rounded-xl px-4 py-3 font-bold">الشروط والأحكام</Link>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-2 bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(59,130,246,0.12)]">
            <div className="text-center mb-8">
              <p className="text-[#3B82F6] font-bold mb-3 tracking-widest">تفضيلات المستخدم</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">تخصيص تجربة الخريطة</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5">
                <h3 className="text-xl font-bold mb-4">المنطقة المفضلة</h3>
                <select value={settings.selectedArea} onChange={(e) => updateSetting("selectedArea", e.target.value)} className="w-full bg-[#021B3A] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]">
                  <option>صور</option><option>برج الشمالي</option><option>النبطية</option>
                  <option>بنت جبيل</option><option>الخيام</option><option>كفركلا</option>
                </select>
              </div>

              <div className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5">
                <h3 className="text-xl font-bold mb-4">أنواع التنبيهات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alertTypeOptions.map((item) => (
                    <label key={item} className="flex items-center gap-3 bg-[#021B3A] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-[#3B82F6] transition">
                      <input type="checkbox" checked={settings.enabledAlertTypes.includes(item)} onChange={() => toggleAlertType(item)} className="w-5 h-5" />
                      <span className="font-bold">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5">
                <h3 className="text-xl font-bold mb-4">خيارات العرض</h3>
                <div className="space-y-3">
                  <ToggleRow title="إظهار شريط الأخبار العاجلة" text="عرض التنبيه العاجل أعلى الخريطة عند وجود حدث مهم." enabled={settings.urgentBar} setEnabled={(v) => updateSetting("urgentBar", v)} />
                  <ToggleRow title="إبراز المناطق المهددة" text="تلوين المنطقة بالكامل عند وجود تهديد أو تمركز." enabled={settings.highlightAreas} setEnabled={(v) => updateSetting("highlightAreas", v)} />
                  <ToggleRow title="تشغيل صوت عند التنبيه" text="تنبيه صوتي عند وصول حدث عاجل جديد." enabled={settings.soundEnabled} setEnabled={(v) => updateSetting("soundEnabled", v)} />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button onClick={handleSave} className={`flex-1 transition rounded-xl px-5 py-4 font-extrabold ${saved ? "bg-green-600 hover:bg-green-700" : "bg-[#3B82F6] hover:bg-[#2563EB]"}`}>
                  {saved ? "✓ تم الحفظ" : "حفظ الإعدادات"}
                </button>
                <Link href="/" className="flex-1 text-center bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] transition rounded-xl px-5 py-4 font-extrabold">العودة للخريطة</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function ToggleRow({ title, text, enabled, setEnabled }: { title: string; text: string; enabled: boolean; setEnabled: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#021B3A] border border-white/10 rounded-xl p-4">
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-slate-400 text-sm leading-6">{text}</p>
      </div>
      <button onClick={() => setEnabled(!enabled)} className={`w-14 h-8 rounded-full p-1 transition flex-shrink-0 ${enabled ? "bg-[#3B82F6]" : "bg-slate-600"}`}>
        <div className={`w-6 h-6 bg-white rounded-full transition-transform ${enabled ? "translate-x-0" : "translate-x-6"}`} />
      </button>
    </div>
  );
}
