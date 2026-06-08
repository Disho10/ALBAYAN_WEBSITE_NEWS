"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { AlertItem, Area } from "@/app/lib/types";
import { ALERT_TYPES } from "@/app/lib/types";
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

const DURATION_OPTIONS = [
  { value: "30", label: "30 دقيقة" },
  { value: "60", label: "ساعة" },
  { value: "180", label: "3 ساعات" },
  { value: "360", label: "6 ساعات" },
  { value: "720", label: "12 ساعة" },
  { value: "1440", label: "24 ساعة" },
  { value: "permanent", label: "دائم" },
];

export default function AdminPage() {
  const [allAreas, setAllAreas] = useState<Area[]>([]);
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
  const [autoPostTelegram, setAutoPostTelegram] = useState(true);

  // Edit mode
  const [editingAlert, setEditingAlert] = useState<AlertItem | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editDuration, setEditDuration] = useState("180");
  const [editIsUrgent, setEditIsUrgent] = useState(false);

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
    return allAreas
      .filter(
        (item) =>
          !alreadySelected.has(item.pcode) &&
          (item.name.includes(areaSearch) ||
            item.nameEn.toLowerCase().includes(areaSearch.toLowerCase()) ||
            item.district.includes(areaSearch))
      )
      .slice(0, 50);
  }, [areaSearch, selectedAreas, allAreas]);

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

  const loadAlerts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
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
  }, [loadAlerts]);

  useEffect(() => {
    fetch("/data/areas.json").then((r) => r.json()).then(setAllAreas).catch(() => {});
  }, []);

  async function handleLogin() {
    setAuthError("");
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message === "Invalid login credentials"
        ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        : error.message);
    } else {
      setIsAllowed(true);
      loadAlerts();
    }
    setAuthLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAllowed(false);
    setAlerts([]);
  }

  function resetForm() {
    setSelectedAreas([]);
    setAreaSearch("");
    setDescription("");
    setDuration("180");
    setRadius(String(selectedType.radius));
    setIsUrgent(false);
  }

  function getDurationText(minutes: string) {
    const opt = DURATION_OPTIONS.find((d) => d.value === minutes);
    return opt ? opt.label : minutes + " دقيقة";
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
      setStatusMsg({ text: "خطأ أثناء النشر: " + error.message, ok: false });
    } else {
      // Auto-post to Telegram
      if (autoPostTelegram) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await fetch("/api/telegram-notify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session?.access_token ?? ""}`,
            },
            body: JSON.stringify({
              alerts: rows.map((r) => ({
                ...r,
                duration_text: getDurationText(duration),
              })),
            }),
          });
        } catch (e) {
          console.warn("Telegram notification failed:", e);
        }
      }

      resetForm();
      loadAlerts();
      setStatusMsg({ text: `تم نشر ${rows.length} حدث على الخريطة بنجاح`, ok: true });
      setTimeout(() => setStatusMsg(null), 4000);
    }
    setPublishing(false);
  }

  // Edit functions
  function startEdit(alert: AlertItem) {
    setEditingAlert(alert);
    setEditDescription(alert.description || "");
    setEditIsUrgent(alert.is_urgent || false);
    setEditDuration("60");
  }

  async function saveEdit() {
    if (!editingAlert) return;

    const updates: Record<string, unknown> = {
      description: editDescription,
      is_urgent: editIsUrgent,
    };

    // Extend duration if selected
    if (editDuration !== "keep") {
      updates.expires_at =
        editDuration === "permanent"
          ? null
          : new Date(Date.now() + Number(editDuration) * 60000).toISOString();
    }

    const { error } = await supabase
      .from("alerts")
      .update(updates)
      .eq("id", editingAlert.id);

    if (error) {
      setStatusMsg({ text: "خطأ أثناء التعديل: " + error.message, ok: false });
    } else {
      setStatusMsg({ text: "تم تعديل الحدث بنجاح", ok: true });
      setTimeout(() => setStatusMsg(null), 3000);
      setEditingAlert(null);
      loadAlerts();
    }
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
    await supabase.from("alerts").delete().not("expires_at", "is", null).lt("expires_at", new Date().toISOString());
    loadAlerts();
  }

  async function clearAll() {
    if (!confirm("هل تريد حذف جميع الأحداث؟ لا يمكن التراجع.")) return;
    await supabase.from("alerts").delete().gte("id", 0);
    loadAlerts();
  }

  const activeCount = alerts.filter((a) => a.status !== "hidden").length;
  const urgentCount = alerts.filter((a) => a.is_urgent).length;
  const hiddenCount = alerts.filter((a) => a.status === "hidden").length;

  // --- AUTH LOADING ---
  if (authLoading) {
    return (
      <main className="min-h-screen bg-[var(--bg-deep)] text-[var(--text)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--blue)] rounded-full animate-spin" />
      </main>
    );
  }

  // --- LOGIN ---
  if (!isAllowed) {
    return (
      <main className="min-h-screen bg-[var(--bg-deep)] text-[var(--text)] flex items-center justify-center p-6" dir="rtl">
        <div className="w-full max-w-md bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl p-8 text-center shadow-lg">
          <p className="text-[var(--accent)] font-bold mb-3">— ADMIN ACCESS</p>
          <h1 className="text-3xl font-extrabold mb-3">دخول لوحة التحكم</h1>
          <p className="text-[var(--text-secondary)] mb-6">هذه الصفحة مخصصة للأشخاص المخوّلين فقط.</p>
          {authError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm font-bold">{authError}</div>
          )}
          <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--blue)] mb-3" dir="ltr" />
          <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--blue)] mb-4" dir="ltr" />
          <button onClick={handleLogin} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition rounded-xl px-5 py-3 font-bold">دخول</button>
          <Link href="/" className="block mt-5 text-[var(--accent)] hover:text-white transition">العودة للخريطة</Link>
        </div>
      </main>
    );
  }

  // --- DASHBOARD ---
  return (
    <main className="min-h-screen bg-[var(--bg-deep)] text-[var(--text)] p-6" dir="rtl">
      <section className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-[var(--border)] pb-6">
          <div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-[var(--accent)] font-bold hover:text-white transition">العودة للخريطة</Link>
              <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm font-bold transition">تسجيل الخروج</button>
            </div>
            <h1 className="text-4xl font-extrabold mt-4">لوحة تحكم AlBayan</h1>
            <p className="text-[var(--text-secondary)] mt-3">إدارة الأحداث المباشرة على الخريطة.</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-bold">النظام يعمل</span>
          </div>
        </header>

        {statusMsg && (
          <div className={`mb-6 p-4 rounded-2xl font-bold text-center ${statusMsg.ok ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
            {statusMsg.text}
          </div>
        )}

        {/* Edit modal */}
        {editingAlert && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <h2 className="text-2xl font-bold mb-2">تعديل الحدث</h2>
              <p className="text-[var(--text-secondary)] mb-6">📍 {editingAlert.area} — {editingAlert.type_label}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">الوصف</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--blue)] resize-none" />
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">تمديد المدة (من الآن)</label>
                  <select value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--blue)]">
                    <option value="keep">إبقاء المدة الحالية</option>
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 cursor-pointer">
                  <input type="checkbox" checked={editIsUrgent} onChange={(e) => setEditIsUrgent(e.target.checked)} className="w-5 h-5" />
                  <span className="font-bold">خبر عاجل</span>
                </label>

                <div className="flex gap-3">
                  <button onClick={saveEdit} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition rounded-xl px-5 py-3 font-bold">حفظ التعديلات</button>
                  <button onClick={() => setEditingAlert(null)} className="flex-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] border border-[var(--border)] transition rounded-xl px-5 py-3 font-bold">إلغاء</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-[var(--text-secondary)] text-sm">النشطة</p>
            <h2 className="text-3xl font-extrabold mt-2">{activeCount}</h2>
          </div>
          <div className="bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-[var(--text-secondary)] text-sm">العاجلة</p>
            <h2 className="text-3xl font-extrabold mt-2 text-red-400">{urgentCount}</h2>
          </div>
          <div className="bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl p-5">
            <p className="text-[var(--text-secondary)] text-sm">المخفية</p>
            <h2 className="text-3xl font-extrabold mt-2 text-[var(--text-secondary)]">{hiddenCount}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Create form */}
          <div className="lg:col-span-1 bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl p-6 shadow-lg">
            <p className="text-red-400 font-bold mb-3">— إنشاء تنبيه</p>
            <h2 className="text-2xl font-bold mb-6">حدث جديد</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">نوع الحدث</label>
                <select value={type} onChange={(e) => { setType(e.target.value); const n = ALERT_TYPES.find((i) => i.type === e.target.value); if (n) setRadius(String(n.radius)); }} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--blue)]">
                  {ALERT_TYPES.map((item) => (<option key={item.type} value={item.type}>{item.label}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  البلدات {selectedAreas.length > 0 && <span className="text-[var(--accent)]">({selectedAreas.length})</span>}
                </label>
                {selectedAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedAreas.map((a) => (
                      <span key={a.pcode} className="flex items-center gap-1 bg-[var(--accent)]/20 border border-[var(--blue)]/40 text-[var(--blue)] rounded-lg px-3 py-1.5 text-sm font-bold">
                        {a.name}
                        <button onClick={() => removeArea(a.pcode)} className="hover:text-red-400 transition text-lg mr-1">&times;</button>
                      </span>
                    ))}
                    <button onClick={() => setSelectedAreas([])} className="text-red-400 text-xs font-bold px-2 py-1 rounded-lg border border-red-400/30 hover:bg-red-400/10 transition">مسح</button>
                  </div>
                )}
                <div className="relative">
                  <input type="text" value={areaSearch} placeholder="ابحث عن بلدة..." onChange={(e) => { setAreaSearch(e.target.value); setShowAreaSuggestions(true); }} onFocus={() => { if (areaSearch) setShowAreaSuggestions(true); }} onBlur={() => setTimeout(() => setShowAreaSuggestions(false), 200)} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--blue)]" />
                  {showAreaSuggestions && filteredAreas.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full bg-[var(--bg-main)] border border-[var(--border)] rounded-xl max-h-64 overflow-y-auto shadow-xl">
                      {filteredAreas.map((item, i) => (
                        <button key={item.pcode || `a-${i}`} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addArea(item)} className="w-full text-right px-4 py-3 hover:bg-[var(--bg-elevated)] transition border-b border-white/5">
                          <span className="font-bold">{item.name}</span>
                          <span className="text-[var(--text-secondary)] text-sm mr-2">— {item.district}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">المدة</label>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--blue)]">
                    {DURATION_OPTIONS.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">النطاق (متر)</label>
                  <input value={radius} onChange={(e) => setRadius(e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--blue)]" dir="ltr" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">الوصف</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="وصف الحدث..." className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--blue)] resize-none" />
              </div>

              <label className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 cursor-pointer">
                <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="w-5 h-5" />
                <span className="font-bold">خبر عاجل</span>
              </label>

              <label className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4 cursor-pointer">
                <input type="checkbox" checked={autoPostTelegram} onChange={(e) => setAutoPostTelegram(e.target.checked)} className="w-5 h-5" />
                <span className="font-bold">نشر تلقائي على تلغرام</span>
              </label>

              <button onClick={publishAlert} disabled={publishing || selectedAreas.length === 0} className={`w-full transition rounded-xl px-5 py-4 font-extrabold text-lg ${publishing || selectedAreas.length === 0 ? "bg-slate-600 cursor-not-allowed" : "bg-[var(--accent)] hover:bg-[var(--accent-hover)]"}`}>
                {publishing ? "جاري النشر..." : selectedAreas.length === 0 ? "اختر بلدة" : `نشر ${selectedAreas.length > 1 ? selectedAreas.length + " أحداث" : "الحدث"}`}
              </button>
            </div>
          </div>

          {/* Alerts list */}
          <div className="lg:col-span-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-[var(--accent)] font-bold mb-2">— الأحداث</p>
                <h2 className="text-2xl font-bold">إدارة الأحداث</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={loadAlerts} className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2 font-bold transition">تحديث</button>
                <button onClick={clearExpired} className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2 font-bold transition">حذف المنتهي</button>
                <button onClick={clearAll} className="bg-red-600 hover:bg-red-700 rounded-xl px-4 py-2 font-bold transition">حذف الكل</button>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-2xl">
                <div className="text-5xl mb-4">🗺️</div>
                <h3 className="text-xl font-bold mb-2">لا توجد أحداث</h3>
                <p className="text-[var(--text-secondary)] mb-4">أضف أول حدث ليظهر مباشرة على الخريطة.</p>
                <p className="text-[var(--text-muted)] text-sm">تأكد من تشغيل <code className="bg-slate-800 px-2 py-1 rounded">supabase-setup.sql</code></p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[720px] overflow-y-auto pl-1">
                {alerts.map((alert) => {
                  const isHidden = alert.status === "hidden";
                  return (
                    <div key={alert.id} className={`rounded-2xl border p-5 transition ${isHidden ? "bg-slate-900/60 border-slate-700 opacity-70" : "bg-[var(--bg-card)] border-[var(--border)]"}`}>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: alert.color }} />
                            <h3 className="text-xl font-bold">{alert.type_label}</h3>
                            {alert.is_urgent && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">عاجل</span>}
                            {isHidden && <span className="bg-slate-600 text-white text-xs px-2 py-1 rounded-full">مخفي</span>}
                          </div>
                          <p className="text-[var(--text-secondary)] mb-1">📍 {alert.area}</p>
                          {alert.description && <p className="text-[var(--text-secondary)] leading-7 mt-2">{alert.description}</p>}
                          <div className="text-xs text-[var(--text-muted)] mt-3">⏳ {getRemainingTime(alert.expires_at)}</div>
                        </div>
                        <div className="flex md:flex-col gap-2 min-w-[120px]">
                          <button onClick={() => startEdit(alert)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-lg px-4 py-2 font-bold transition">تعديل</button>
                          {isHidden ? (
                            <button onClick={() => showAlert(alert.id)} className="bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 font-bold transition">إظهار</button>
                          ) : (
                            <button onClick={() => hideAlert(alert.id)} className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-2 font-bold transition">إخفاء</button>
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