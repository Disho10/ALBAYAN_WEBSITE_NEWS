"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { areas } from "@/app/areas";
import { supabase } from "@/app/lib/supabase";
import type { AlertItem } from "@/app/lib/types";
import { ALERT_TYPES } from "@/app/lib/types";
import type { Area } from "@/app/lib/types";
import Footer from "@/app/components/Footer";

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
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [type, setType] = useState("strike");
  const [areaSearch, setAreaSearch] = useState("");
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("180");
  const [radius, setRadius] = useState("900");
  const [isUrgent, setIsUrgent] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAllowed, setIsAllowed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const selectedType = useMemo(
    () => ALERT_TYPES.find((item) => item.type === type) || ALERT_TYPES[0],
    [type]
  );

  const filteredAreas = useMemo(() => {
    if (!areaSearch.trim()) return [];
    const alreadySelected = new Set(selectedAreas.map((a) => a.pcode));
    return areas
      .filter(
        (item) =>
          !alreadySelected.has(item.pcode) &&
          (item.name.includes(areaSearch) ||
            item.nameEn.toLowerCase().includes(areaSearch.toLowerCase()))
      )
      .slice(0, 50);
  }, [areaSearch, selectedAreas]);

  function addArea(area: Area) {
    if (!selectedAreas.find((a) => a.pcode === area.pcode)) {
      setSelectedAreas((prev) => [...prev, area]);
    }
    setAreaSearch("");
    setShowAreaSuggestions(false);
  }

  function removeArea(pcode: string) {
    setSelectedAreas((prev) => prev.filter((a) => a.pcode !== pcode));
  }

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAllowed(!!session);
      setAuthLoading(false);
      if (session) loadAlerts();
    }
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAllowed(!!session);
      if (session) loadAlerts();
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  async function handleLogin() {
    setAuthError("");
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message === "Invalid login credentials"
        ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        : error.message);
      setAuthLoading(false);
    } else {
      setIsAllowed(true);
      setAuthLoading(false);
      loadAlerts();
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAllowed(false);
    setAlerts([]);
  }

  async function loadAlerts() {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load alerts:", error);
      setStatusMsg({ text: "خطأ في تحميل الأحداث: " + error.message, ok: false });
    } else {
      setAlerts(data || []);
    }
  }

  function resetForm() {
    setSelectedAreas([]);
    setAreaSearch("");
    setDescription("");
    setDuration("180");
    setRadius(String(selectedType.radius));
    setIsUrgent(false);
  }

  async function publishAlert() {
    if (selectedAreas.length === 0) {
      setStatusMsg({ text: "يرجى اختيار بلدة واحدة على الأقل", ok: false });
      return;
    }

    setPublishing(true);
    setStatusMsg(null);

    const expires_at =
      duration === "permanent"
        ? null
        : new Date(Date.now() + Number(duration) * 60000).toISOString();

    const rows = selectedAreas.map((area) => ({
      title: selectedType.label,
      area: area.name,
      type: selectedType.type,
      type_label: selectedType.label,
      color: selectedType.color,
      description,
      lat: area.lat,
      lng: area.lng,
      radius: Number(radius) || selectedType.radius,
      expires_at,
      status: "active",
      is_urgent: isUrgent,
    }));

    const { error } = await supabase.from("alerts").insert(rows);

    if (error) {
      console.error("Insert error:", error);
      setStatusMsg({ text: "خطأ أثناء النشر: " + error.message + (error.hint ? " — " + error.hint : ""), ok: false });
    } else {
      resetForm();
      loadAlerts();
      setStatusMsg({
        text: `تم نشر ${rows.length} حدث على الخريطة بنجاح`,
        ok: true,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    }

    setPublishing(false);
  }

  async function hideAlert(id: number) {
    await supabase.from("alerts").update({ status: "hidden" }).eq("id", id);
    loadAlerts();
  }

  async function showAlert(id: number) {
    await supabase.from("alerts").update({ status: "active" }).eq("id", id);
    loadAlerts();
  }

  async function deleteAlert(id: number) {
    if (!confirm("هل تريد حذف هذا الحدث نهائيًا؟")) return;
    await supabase.from("alerts").delete().eq("id", id);
    loadAlerts();
  }

  async function clearExpired() {
    const { error } = await supabase
      .from("alerts")
      .delete()
      .not("expires_at", "is", null)
      .lt("expires_at", new Date().toISOString());
    if (error) console.error("Clear expired error:", error);
    loadAlerts();
  }

  async function clearAll() {
    if (!confirm("هل تريد حذف جميع الأحداث؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    const { error } = await supabase.from("alerts").delete().gte("id", 0);
    if (error) console.error("Clear all error:", error);
    loadAlerts();
  }

  const activeCount = alerts.filter((a) => a.status !== "hidden").length;
  const urgentCount = alerts.filter((a) => a.is_urgent).length;
  const hiddenCount = alerts.filter((a) => a.status === "hidden").length;

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#00152D] text-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#134B78] border-t-[#3B82F6] rounded-full animate-spin" />
      </main>
    );
  }

  if (!isAllowed) {
    return (
      <main className="min-h-screen bg-[#00152D] text-white flex items-center justify-center p-6" dir="rtl">
        <div className="w-full max-w-md bg-[#021B3A] border border-[#134B78] rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(59,130,246,0.12)]">
          <p className="text-red-400 font-bold mb-3 tracking-widest">— ADMIN ACCESS</p>
          <h1 className="text-3xl font-extrabold mb-3">دخول لوحة التحكم</h1>
          <p className="text-slate-400 mb-6">هذه الصفحة مخصصة للأشخاص المخوّلين فقط.</p>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm font-bold">
              {authError}
            </div>
          )}

          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6] mb-3"
            dir="ltr"
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6] mb-4"
            dir="ltr"
          />
          <button onClick={handleLogin} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] transition rounded-xl px-5 py-3 font-bold">
            دخول
          </button>
          <Link href="/" className="block mt-5 text-[#3B82F6] hover:text-white transition">
            العودة للخريطة
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#00152D] text-white p-6" dir="rtl">
      <section className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-[#134B78] pb-6">
          <div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-[#3B82F6] font-bold hover:text-white transition">العودة للخريطة</Link>
              <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm font-bold transition">تسجيل الخروج</button>
            </div>
            <h1 className="text-4xl font-extrabold mt-4">لوحة تحكم AlBayan Alert Map</h1>
            <p className="text-slate-300 mt-3">إدارة الأحداث المباشرة، نشر التنبيهات، وإخفاء أو حذف البلاغات من الخريطة.</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-bold">النظام يعمل</span>
          </div>
        </header>

        {/* Status message */}
        {statusMsg && (
          <div className={`mb-6 p-4 rounded-2xl font-bold text-center ${statusMsg.ok ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
            {statusMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">الأحداث النشطة</p>
            <h2 className="text-3xl font-extrabold mt-2">{activeCount}</h2>
          </div>
          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">العاجلة</p>
            <h2 className="text-3xl font-extrabold mt-2 text-red-400">{urgentCount}</h2>
          </div>
          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">المخفية</p>
            <h2 className="text-3xl font-extrabold mt-2 text-slate-300">{hiddenCount}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Create alert form */}
          <div className="lg:col-span-1 bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 shadow-[0_0_35px_rgba(59,130,246,0.12)]">
            <p className="text-red-400 font-bold mb-3">— إنشاء تنبيه</p>
            <h2 className="text-2xl font-bold mb-6">إضافة حدث جديد</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-300 mb-2">نوع الحدث</label>
                <select value={type} onChange={(e) => { setType(e.target.value); const next = ALERT_TYPES.find((i) => i.type === e.target.value); if (next) setRadius(String(next.radius)); }} className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]">
                  {ALERT_TYPES.map((item) => (
                    <option key={item.type} value={item.type}>{item.label}</option>
                  ))}
                </select>
              </div>

              {/* Multi-village selector */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  البلدات المستهدفة
                  {selectedAreas.length > 0 && (
                    <span className="text-[#3B82F6] mr-2">({selectedAreas.length} بلدة)</span>
                  )}
                </label>

                {/* Selected areas chips */}
                {selectedAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedAreas.map((area) => (
                      <span key={area.pcode} className="flex items-center gap-1 bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#93C5FD] rounded-lg px-3 py-1.5 text-sm font-bold">
                        {area.name}
                        <button onClick={() => removeArea(area.pcode)} className="hover:text-red-400 transition text-lg leading-none mr-1">&times;</button>
                      </span>
                    ))}
                    <button onClick={() => setSelectedAreas([])} className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 rounded-lg border border-red-400/30 hover:bg-red-400/10 transition">
                      مسح الكل
                    </button>
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={areaSearch}
                    placeholder="ابحث عن بلدة وأضفها..."
                    onChange={(e) => { setAreaSearch(e.target.value); setShowAreaSuggestions(true); }}
                    onFocus={() => { if (areaSearch) setShowAreaSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowAreaSuggestions(false), 200)}
                    className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]"
                  />
                  {showAreaSuggestions && filteredAreas.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full bg-[#021B3A] border border-[#134B78] rounded-xl overflow-hidden max-h-64 overflow-y-auto shadow-xl">
                      {filteredAreas.map((item, index) => (
                        <button
                          key={item.pcode || `area-${index}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addArea(item)}
                          className="w-full text-right px-4 py-3 hover:bg-[#0A3563] transition border-b border-white/5"
                        >
                          <span className="font-bold">{item.name}</span>
                          <span className="text-slate-400 text-sm mr-2">— {item.district}، {item.governorate}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">مدة الظهور</label>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]">
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
                  <label className="block text-sm text-slate-300 mb-2">نطاق التأثير بالمتر</label>
                  <input value={radius} onChange={(e) => setRadius(e.target.value)} className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6]" dir="ltr" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">وصف الحدث</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="مثال: استهداف محيط البلدة دون معلومات عن إصابات حتى الآن..." className="w-full bg-[#001F3F] border border-[#134B78] rounded-xl px-4 py-3 outline-none focus:border-[#3B82F6] resize-none" />
              </div>

              <label className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 cursor-pointer">
                <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="w-5 h-5" />
                <span className="font-bold">تمييز كخبر عاجل أعلى الخريطة</span>
              </label>

              <button
                onClick={publishAlert}
                disabled={publishing || selectedAreas.length === 0}
                className={`w-full transition rounded-xl px-5 py-4 font-extrabold text-lg ${publishing || selectedAreas.length === 0 ? "bg-slate-600 cursor-not-allowed" : "bg-[#3B82F6] hover:bg-[#2563EB]"}`}
              >
                {publishing
                  ? "جاري النشر..."
                  : selectedAreas.length === 0
                  ? "اختر بلدة واحدة على الأقل"
                  : `نشر ${selectedAreas.length > 1 ? selectedAreas.length + " أحداث" : "الحدث"} على الخريطة`}
              </button>
            </div>
          </div>

          {/* Alerts list */}
          <div className="lg:col-span-2 bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 shadow-[0_0_35px_rgba(59,130,246,0.12)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-red-400 font-bold mb-2">— الأحداث</p>
                <h2 className="text-2xl font-bold">إدارة الأحداث الحالية</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={loadAlerts} className="bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] rounded-xl px-4 py-2 font-bold transition">تحديث</button>
                <button onClick={clearExpired} className="bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] rounded-xl px-4 py-2 font-bold transition">حذف المنتهي</button>
                <button onClick={clearAll} className="bg-red-600 hover:bg-red-700 rounded-xl px-4 py-2 font-bold transition">حذف الكل</button>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[#134B78] rounded-2xl">
                <div className="text-5xl mb-4">🗺️</div>
                <h3 className="text-xl font-bold mb-2">لا توجد أحداث بعد</h3>
                <p className="text-slate-400 mb-4">أضف أول حدث ليظهر مباشرة على الخريطة.</p>
                <p className="text-slate-500 text-sm">إذا كنت ترى هذه الرسالة بعد إضافة أحداث، تأكد من تشغيل ملف <code className="bg-slate-800 px-2 py-1 rounded">supabase-setup.sql</code> في Supabase SQL Editor.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[720px] overflow-y-auto pl-1">
                {alerts.map((alert) => {
                  const isHidden = alert.status === "hidden";
                  return (
                    <div key={alert.id} className={`rounded-2xl border p-5 transition ${isHidden ? "bg-slate-900/60 border-slate-700 opacity-70" : "bg-[#001F3F] border-[#134B78]"}`}>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: alert.color }} />
                            <h3 className="text-xl font-bold">{alert.type_label}</h3>
                            {alert.is_urgent && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">عاجل</span>}
                            {isHidden && <span className="bg-slate-600 text-white text-xs px-2 py-1 rounded-full">مخفي</span>}
                          </div>
                          <p className="text-slate-300 mb-1">📍 {alert.area}</p>
                          {alert.description && <p className="text-slate-400 leading-7 mt-2">{alert.description}</p>}
                          <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-4" dir="ltr">
                            <span>Lat: {alert.lat}</span>
                            <span>Lng: {alert.lng}</span>
                            <span>Radius: {alert.radius}m</span>
                            <span dir="rtl">⏳ {getRemainingTime(alert.expires_at)}</span>
                          </div>
                        </div>
                        <div className="flex md:flex-col gap-2 min-w-[120px]">
                          {isHidden ? (
                            <button onClick={() => showAlert(alert.id)} className="bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 font-bold transition">إظهار</button>
                          ) : (
                            <button onClick={() => hideAlert(alert.id)} className="bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] rounded-lg px-4 py-2 font-bold transition">إخفاء</button>
                          )}
                          <button onClick={() => deleteAlert(alert.id)} className="bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 font-bold transition">حذف</button>
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
      <Footer />
    </main>
  );
}
