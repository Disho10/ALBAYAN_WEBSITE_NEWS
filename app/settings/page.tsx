"use client";

import Link from "next/link";
import { useState } from "react";

const alertTypes = [
  "غارات / قصف مدفعي",
  "مسيّرات",
  "تهديدات",
  "تمركز العدو",
  "انتشار الجيش",
  "حوادث السير",
  "إشتباكات",
  "إصابات",
];

export default function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [urgentBar, setUrgentBar] = useState(true);
  const [highlightAreas, setHighlightAreas] = useState(true);
  const [selectedArea, setSelectedArea] = useState("صور");

  return (
    <main className="min-h-screen bg-[#00152D] text-white p-6" dir="rtl">
      <section className="max-w-6xl mx-auto">
        <Link href="/" className="text-[#3B82F6] font-bold hover:text-white transition">
          العودة للخريطة
        </Link>

        <div className="mt-10 mb-10 text-center">
          <p className="text-red-400 font-bold mb-3 tracking-widest">
            — SETTINGS CENTER
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            إعدادات الخريطة
          </h1>

          <p className="text-slate-300 leading-8 max-w-3xl mx-auto">
            خصّص تجربة استخدام AlBayan Alert Map، واختر طريقة عرض التنبيهات
            والمناطق المهمة وروابط الوصول السريع.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🟢</div>
            <h3 className="font-bold mb-1">النظام يعمل</h3>
            <p className="text-slate-400 text-sm">الخريطة والتنبيهات تعمل بشكل طبيعي.</p>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">📍</div>
            <h3 className="font-bold mb-1">منطقة مفضلة</h3>
            <p className="text-slate-400 text-sm">اختر منطقة تظهر لك بشكل أسرع.</p>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="font-bold mb-1">تحكم بالتنبيهات</h3>
            <p className="text-slate-400 text-sm">حدد ما تريد متابعته على الخريطة.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-[#021B3A] border border-[#134B78] rounded-3xl p-6">
              <p className="text-red-400 font-bold mb-4 tracking-widest">
                SYSTEM STATUS
              </p>

              <div className="space-y-5">
                <div className="border-b border-white/10 pb-4">
                  <p className="text-slate-500 text-xs font-bold mb-2">STATUS</p>
                  <h3 className="font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    Operational
                  </h3>
                </div>

                <div className="border-b border-white/10 pb-4">
                  <p className="text-slate-500 text-xs font-bold mb-2">COVERAGE</p>
                  <h3 className="font-bold">Lebanon Coverage</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-7">
                    تغطية ميدانية حسب المناطق المتوفرة في الخريطة.
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-xs font-bold mb-2">VERSION</p>
                  <h3 className="font-bold">AlBayan Alert Map v1.0</h3>
                </div>
              </div>
            </div>

            <div className="bg-[#0A3563] border border-[#134B78] rounded-3xl p-6">
              <p className="text-slate-400 text-xs font-bold tracking-widest mb-2">
                QUICK LINKS
              </p>

              <div className="space-y-3">
                <Link href="/faq" className="block bg-[#021B3A] hover:bg-[#134B78] transition rounded-xl px-4 py-3 font-bold">
                  FAQ
                </Link>

                <Link href="/privacy" className="block bg-[#021B3A] hover:bg-[#134B78] transition rounded-xl px-4 py-3 font-bold">
                  Privacy Policy
                </Link>

                <Link href="/terms" className="block bg-[#021B3A] hover:bg-[#134B78] transition rounded-xl px-4 py-3 font-bold">
                  Terms & Conditions
                </Link>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-2 bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(59,130,246,0.12)]">
            <div className="text-center mb-8">
              <p className="text-[#3B82F6] font-bold mb-3 tracking-widest">
                USER PREFERENCES
              </p>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                تخصيص تجربة الخريطة
              </h2>

              <p className="text-slate-300 leading-8 max-w-2xl mx-auto">
                هذه الإعدادات تساعد المستخدم على تخصيص طريقة متابعة التنبيهات
                والمناطق المهمة داخل المنصة.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5">
                <h3 className="text-xl font-bold mb-4">المنطقة المفضلة</h3>

                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full bg-[#021B3A] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]"
                >
                  <option>صور</option>
                  <option>برج الشمالي</option>
                  <option>النبطية</option>
                  <option>بنت جبيل</option>
                  <option>الخيام</option>
                  <option>كفركلا</option>
                </select>
              </div>

              <div className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5">
                <h3 className="text-xl font-bold mb-4">أنواع التنبيهات</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alertTypes.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 bg-[#021B3A] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-[#3B82F6] transition"
                    >
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                      <span className="font-bold">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5">
                <h3 className="text-xl font-bold mb-4">خيارات العرض</h3>

                <div className="space-y-3">
                  <ToggleRow
                    title="إظهار شريط الأخبار العاجلة"
                    text="عرض التنبيه العاجل أعلى الخريطة عند وجود حدث مهم."
                    enabled={urgentBar}
                    setEnabled={setUrgentBar}
                  />

                  <ToggleRow
                    title="إبراز المناطق المهددة"
                    text="تلوين المنطقة بالكامل عند وجود تهديد أو تمركز."
                    enabled={highlightAreas}
                    setEnabled={setHighlightAreas}
                  />

                  <ToggleRow
                    title="تشغيل صوت عند التنبيه"
                    text="تنبيه صوتي عند وصول حدث عاجل جديد."
                    enabled={soundEnabled}
                    setEnabled={setSoundEnabled}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] transition rounded-xl px-5 py-4 font-extrabold">
                  حفظ الإعدادات
                </button>

                <Link
                  href="/"
                  className="flex-1 text-center bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] transition rounded-xl px-5 py-4 font-extrabold"
                >
                  العودة للخريطة
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ToggleRow({
  title,
  text,
  enabled,
  setEnabled,
}: {
  title: string;
  text: string;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#021B3A] border border-white/10 rounded-xl p-4">
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-slate-400 text-sm leading-6">{text}</p>
      </div>

      <button
        onClick={() => setEnabled(!enabled)}
        className={`w-14 h-8 rounded-full p-1 transition ${
          enabled ? "bg-[#3B82F6]" : "bg-slate-600"
        }`}
      >
        <div
          className={`w-6 h-6 bg-white rounded-full transition ${
            enabled ? "translate-x-[-24px]" : ""
          }`}
        />
      </button>
    </div>
  );
}
