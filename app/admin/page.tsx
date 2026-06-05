"use client";

import { useMemo, useState } from "react";
import { areas } from "@/app/areas";

type AlertItem = {
  id: number;
  title: string;
  area: string;
  type: string;
  typeLabel: string;
  color: string;
  description: string;
  lat: number;
  lng: number;
  radius: number;
  expiresAt?: string | null;
  status?: string;
  isUrgent?: boolean;
};

const alertTypes = [
  { type: "strike", label: "🚨 غارة", color: "#EF4444", radius: 900 },
  { type: "artillery", label: "💥 قصف مدفعي", color: "#DC2626", radius: 900 },
  { type: "drone", label: "🚁 نشاط مسيّر", color: "#1E5EFF", radius: 1200 },
  { type: "threat", label: "⚠️ تهديد", color: "#F59E0B", radius: 1000 },
  { type: "enemy_position", label: "📍 تمركز العدو", color: "#A855F7", radius: 1000 },
  { type: "army_position", label: "🟢 انتشار الجيش اللبناني", color: "#22C55E", radius: 1000 },
  { type: "traffic", label: "🚗 حادث سير", color: "#38BDF8", radius: 700 },
  { type: "crowd", label: "⭕ اشتباكات", color: "#DC2626", radius: 700 },
  { type: "fire", label: "🔥 حريق", color: "#F97316", radius: 800 },
  { type: "injuries", label: "🚑 إصابات", color: "#E11D48", radius: 800 },
];

function getSavedAlerts(): AlertItem[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem("alerts") || "[]");
  } catch {
    return [];
  }
}

function getRemainingTime(expiresAt?: string | null) {
  if (!expiresAt) return "دائم";

  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "انتهى";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} دقيقة`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining === 0 ? `${hours} ساعة` : `${hours} ساعة و ${remaining} دقيقة`;
}

export default function AdminPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(getSavedAlerts());
  const [type, setType] = useState("strike");
  const [areaSearch, setAreaSearch] = useState("صور");
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("180");
  const [radius, setRadius] = useState("900");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  
  const ADMIN_PASSWORD = "Nimda@admin$4";

  const [password, setPassword] = useState("");
  const [isAllowed, setIsAllowed] = useState(false);

  const selectedType = useMemo(
    () => alertTypes.find((item) => item.type === type) || alertTypes[0],
    [type]
  );

  const selectedArea = useMemo(
    () => areas.find((item) => item.name === areaSearch) || areas[0],
    [areaSearch]
  );

  const filteredAreas = useMemo(() => {
    return areas.filter((item) =>
      item.name.toLowerCase().includes(areaSearch.toLowerCase())
    );
  }, [areaSearch]);

  function saveAlerts(nextAlerts: AlertItem[]) {
    localStorage.setItem("alerts", JSON.stringify(nextAlerts));
    setAlerts(nextAlerts);
    window.dispatchEvent(new Event("storage"));
  }

  function resetForm() {
    setDescription("");
    setDuration("180");
    setRadius(String(selectedType.radius));
    setLat("");
    setLng("");
    setIsUrgent(false);
  }

  function publishAlert() {
    const foundArea = areas.find((item) => item.name === areaSearch);

    if (!foundArea && !lat && !lng) {
      alert("يرجى اختيار بلدة من الاقتراحات أو إدخال الإحداثيات يدويًا");
      return;
    }

    const finalLat = lat ? Number(lat) : (foundArea || selectedArea).lat;
    const finalLng = lng ? Number(lng) : (foundArea || selectedArea).lng;

    if (!finalLat || !finalLng) {
      alert("يرجى إدخال إحداثيات صحيحة");
      return;
    }

    const expiresAt =
      duration === "permanent"
        ? null
        : new Date(Date.now() + Number(duration) * 60000).toISOString();

    const newAlert: AlertItem = {
      id: Date.now(),
      title: selectedType.label,
      area: foundArea ? foundArea.name : areaSearch,
      type: selectedType.type,
      typeLabel: selectedType.label,
      color: selectedType.color,
      description,
      lat: finalLat,
      lng: finalLng,
      radius: Number(radius) || selectedType.radius,
      expiresAt,
      status: "active",
      isUrgent,
    };

    saveAlerts([newAlert, ...alerts]);
    resetForm();
    alert("تم نشر الحدث على الخريطة");
  }

  function hideAlert(id: number) {
    saveAlerts(
      alerts.map((alert) =>
        alert.id === id ? { ...alert, status: "hidden" } : alert
      )
    );
  }

  function showAlert(id: number) {
    saveAlerts(
      alerts.map((alert) =>
        alert.id === id ? { ...alert, status: "active" } : alert
      )
    );
  }

  function deleteAlert(id: number) {
    if (!confirm("هل تريد حذف هذا الحدث نهائيًا؟")) return;
    saveAlerts(alerts.filter((alert) => alert.id !== id));
  }

  function clearExpired() {
    saveAlerts(
      alerts.filter((alert) => {
        if (!alert.expiresAt) return true;
        return new Date(alert.expiresAt).getTime() > Date.now();
      })
    );
  }

  function clearAll() {
    if (!confirm("هل تريد حذف جميع الأحداث؟")) return;
    saveAlerts([]);
  }

  const activeCount = alerts.filter((a) => a.status !== "hidden").length;
  const urgentCount = alerts.filter((a) => a.isUrgent).length;
  const hiddenCount = alerts.filter((a) => a.status === "hidden").length;

  if (!isAllowed) {
    return (
      <main
        className="min-h-screen bg-[#00152D] text-white flex items-center justify-center p-6"
        dir="rtl"
      >
        <div className="w-full max-w-md bg-[#021B3A] border border-[#134B78] rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(59,130,246,0.12)]">
          <p className="text-red-400 font-bold mb-3 tracking-widest">
            — ADMIN ACCESS
          </p>

          <h1 className="text-3xl font-extrabold mb-3">
            دخول لوحة التحكم
          </h1>

          <p className="text-slate-400 mb-6">
            هذه الصفحة مخصصة للأشخاص المخوّلين فقط.
          </p>

          <input
            type="password"
            placeholder="أدخل كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (password === ADMIN_PASSWORD) {
                  setIsAllowed(true);
                } else {
                  alert("كلمة المرور غير صحيحة");
                }
              }
            }}
            className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6] mb-4"
          />

          <button
            onClick={() => {
              if (password === ADMIN_PASSWORD) {
                setIsAllowed(true);
              } else {
                alert("كلمة المرور غير صحيحة");
              }
            }}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] transition rounded-xl px-5 py-3 font-bold"
          >
            دخول
          </button>

          <a
            href="/"
            className="block mt-5 text-[#3B82F6] hover:text-white transition"
          >
            العودة للخريطة
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#00152D] text-white p-6" dir="rtl">
      <section className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-[#134B78] pb-6">
          <div>
            <a href="/" className="text-[#3B82F6] font-bold hover:text-white transition">
              العودة للخريطة
            </a>

            <h1 className="text-4xl font-extrabold mt-4">
              لوحة تحكم AlBayan Alert Map
            </h1>

            <p className="text-slate-300 mt-3">
              إدارة الأحداث المباشرة، نشر التنبيهات، وإخفاء أو حذف البلاغات من الخريطة.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-bold">النظام يعمل</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">الأحداث النشطة</p>
            <h2 className="text-3xl font-extrabold mt-2">{activeCount}</h2>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">العاجلة</p>
            <h2 className="text-3xl font-extrabold mt-2 text-red-400">
              {urgentCount}
            </h2>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">المخفية</p>
            <h2 className="text-3xl font-extrabold mt-2 text-slate-300">
              {hiddenCount}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 shadow-[0_0_35px_rgba(59,130,246,0.12)]">
            <p className="text-red-400 font-bold mb-3">— CREATE ALERT</p>

            <h2 className="text-2xl font-bold mb-6">إضافة حدث جديد</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  نوع الحدث
                </label>

                <select
                  value={type}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    const next = alertTypes.find((item) => item.type === nextType);
                    setType(nextType);
                    if (next) setRadius(String(next.radius));
                  }}
                  className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]"
                >
                  {alertTypes.map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm text-slate-300 mb-2">
                  البلدة
                </label>

                <input
                  type="text"
                  value={areaSearch}
                  placeholder="اكتب اسم البلدة..."
                  onChange={(e) => {
                    setAreaSearch(e.target.value);
                    setShowAreaSuggestions(true);
                  }}
                  onFocus={() => setShowAreaSuggestions(true)}
                  className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]"
                />

                {showAreaSuggestions && areaSearch && (
                  <div className="absolute z-50 mt-2 w-full bg-[#021B3A] border border-[#134B78] rounded-xl overflow-hidden max-h-64 overflow-y-auto shadow-xl">
                    {filteredAreas.length > 0 ? (
                      filteredAreas.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setAreaSearch(item.name);
                            setShowAreaSuggestions(false);
                          }}
                          className="w-full text-right px-4 py-3 hover:bg-[#0A3563] transition border-b border-white/5"
                        >
                          {item.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-slate-400">
                        لا توجد نتائج
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Lat اختياري
                  </label>

                  <input
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder={String(selectedArea.lat)}
                    className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Lng اختياري
                  </label>

                  <input
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder={String(selectedArea.lng)}
                    className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    مدة الظهور
                  </label>

                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]"
                  >
                    <option value="30">30 دقيقة</option>
                    <option value="60">ساعة</option>
                    <option value="180">3 ساعات</option>
                    <option value="360">6 ساعات</option>
                    <option value="720">12 ساعة</option>
                    <option value="1440">24 ساعة</option>
                    <option value="permanent">دائم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    نطاق التأثير بالمتر
                  </label>

                  <input
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  وصف الحدث
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="مثال: استهداف محيط البلدة دون معلومات عن إصابات حتى الآن..."
                  className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6] resize-none"
                />
              </div>

              <label className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-bold">تمييز كخبر عاجل أعلى الخريطة</span>
              </label>

              <button
                onClick={publishAlert}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] transition rounded-xl px-5 py-4 font-extrabold text-lg"
              >
                نشر الحدث على الخريطة
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 shadow-[0_0_35px_rgba(59,130,246,0.12)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-red-400 font-bold mb-2">— LIVE EVENTS</p>
                <h2 className="text-2xl font-bold">إدارة الأحداث الحالية</h2>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearExpired}
                  className="bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] rounded-xl px-4 py-2 font-bold transition"
                >
                  حذف المنتهي
                </button>

                <button
                  onClick={clearAll}
                  className="bg-red-600 hover:bg-red-700 rounded-xl px-4 py-2 font-bold transition"
                >
                  حذف الكل
                </button>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[#134B78] rounded-2xl">
                <div className="text-5xl mb-4">🗺️</div>
                <h3 className="text-xl font-bold mb-2">لا توجد أحداث بعد</h3>
                <p className="text-slate-400">
                  أضف أول حدث ليظهر مباشرة على الخريطة.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
                {alerts.map((alert) => {
                  const isHidden = alert.status === "hidden";

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-2xl border p-5 transition ${
                        isHidden
                          ? "bg-slate-900/60 border-slate-700 opacity-70"
                          : "bg-[#001F3F] border-[#134B78]"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: alert.color }}
                            />
                            <h3 className="text-xl font-bold">{alert.typeLabel}</h3>

                            {alert.isUrgent && (
                              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                عاجل
                              </span>
                            )}

                            {isHidden && (
                              <span className="bg-slate-600 text-white text-xs px-2 py-1 rounded-full">
                                مخفي
                              </span>
                            )}
                          </div>

                          <p className="text-slate-300 mb-1">📍 {alert.area}</p>

                          {alert.description && (
                            <p className="text-slate-400 leading-7 mt-2">
                              {alert.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-4">
                            <span>Lat: {alert.lat}</span>
                            <span>Lng: {alert.lng}</span>
                            <span>Radius: {alert.radius}m</span>
                            <span>⏳ {getRemainingTime(alert.expiresAt)}</span>
                          </div>
                        </div>

                        <div className="flex md:flex-col gap-2 min-w-[120px]">
                          {isHidden ? (
                            <button
                              onClick={() => showAlert(alert.id)}
                              className="bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 font-bold transition"
                            >
                              إظهار
                            </button>
                          ) : (
                            <button
                              onClick={() => hideAlert(alert.id)}
                              className="bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] rounded-lg px-4 py-2 font-bold transition"
                            >
                              إخفاء
                            </button>
                          )}

                          <button
                            onClick={() => deleteAlert(alert.id)}
                            className="bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 font-bold transition"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer
        dir="ltr"
        className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-slate-500"
      >
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/faq" className="hover:text-white transition">
            FAQ
          </a>

          <span>·</span>

          <a href="/terms" className="hover:text-white transition">
            Terms & Conditions
          </a>

          <span>·</span>

          <a href="/privacy" className="hover:text-white transition">
            Privacy Policy
          </a>

          <span>·</span>

          <span>© 2026 — by AlBayan Alert Map · All rights reserved</span>
        </div>
      </footer>
    </main>
  );
}
