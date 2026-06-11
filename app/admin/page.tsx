"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, ArrowLeft, Check, Clock, Edit3, Eye,
  EyeOff, LogOut, MapPin, RefreshCw, Search, Send, Shield, Trash2, X, Zap, Radio, Copy, Ruler, FileText, List,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import type { AlertItem, Area } from "@/app/lib/types";
import { ALERT_TYPES } from "@/app/lib/types";
import Footer from "@/app/components/Footer";

function getRemainingTime(expiresAt?: string | null) {
  if (!expiresAt) return "دائم";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "انتهى";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} دقيقة`;
  const h = Math.floor(m / 60), rm = m % 60;
  return rm === 0 ? `${h} ساعة` : `${h}س ${rm}د`;
}

function getRemainingColor(expiresAt?: string | null) {
  if (!expiresAt) return "#5A6B80";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "#5A6B80";
  const m = Math.floor(diff / 60000);
  if (m < 15) return "#EF4444";
  if (m < 60) return "#F59E0B";
  return "#22C55E";
}

function cleanEmoji(s: string) {
  return s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, "").trim();
}

const TYPE_COLOR: Record<string, string> = {
  strike: "#EF4444", artillery: "#DC2626", drone: "#5BA4E6",
  threat: "#F59E0B", enemy_position: "#A855F7", army_position: "#22C55E",
  traffic: "#38BDF8", crowd: "#DC2626", fire: "#F97316", injuries: "#E11D48",
  quadcopter: "#06B6D4", helicopter: "#64748B", warplanes: "#6366F1",
};

type Template = { name: string; type: string; description: string; duration: string; radius: string; isUrgent: boolean };
type LogEntry = { action: string; area: string; time: string; admin: string };

const DURATION_OPTIONS = [
  { value: "30", label: "30 دقيقة" },
  { value: "60", label: "ساعة" },
  { value: "180", label: "3 ساعات" },
  { value: "360", label: "6 ساعات" },
  { value: "720", label: "12 ساعة" },
  { value: "1440", label: "24 ساعة" },
  { value: "permanent", label: "دائم" },
];

const GLOBAL_STYLES = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes toggleOn { from{left:3px} to{left:22px} }
  .adm-row:hover { background: rgba(30,51,80,0.35) !important; }
  .adm-icon-btn:hover { opacity: 0.75; transform: scale(1.05); }
  .adm-btn-ghost:hover { background: rgba(30,51,80,0.6) !important; color: #F1F5F9 !important; }
  .adm-type-btn:hover { border-color: rgba(91,164,230,0.3) !important; }
  .adm-stat-card { transition: transform 0.15s, border-color 0.15s; }
  .adm-stat-card:hover { transform: translateY(-2px); border-color: #274060 !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1E3350; border-radius: 2px; }
  @media (max-width: 1024px) {
    .adm-main-grid { grid-template-columns: 1fr !important; }
    .adm-alerts-list { order: 1; }
    .adm-create-form { order: 2; }
    .adm-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 640px) {
    .adm-header { padding: 0 14px !important; }
    .adm-header-nav { display: none !important; }
    .adm-body { padding: 14px 14px 0 !important; }
    .adm-stats-grid { gap: 8px !important; }
    .adm-stat-card { padding: 12px 14px 10px !important; }
    .adm-stat-card .adm-stat-value { font-size: 24px !important; }
    .adm-modal-body { padding: 16px !important; }
    .adm-modal-type-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 480px) {
    .adm-list-actions { flex-wrap: wrap; gap: 4px !important; }
  }
`;

const inp = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "rgba(10,22,40,0.7)",
  border: "1px solid #1E3350",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "#F1F5F9",
  fontSize: "13px",
  outline: "none",
  fontFamily: "inherit",
  fontWeight: 600,
  transition: "border-color 0.15s",
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: "44px", height: "24px",
        background: checked ? "#E53935" : "#1E3350",
        borderRadius: "12px", border: "none",
        cursor: "pointer", position: "relative",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        display: "block",
        position: "absolute", top: "3px",
        left: checked ? "22px" : "3px",
        width: "18px", height: "18px",
        background: "white", borderRadius: "50%",
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
      }} />
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: "10px", color: "#5A6B80", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
      {children}
    </div>
  );
}

export default function AdminPage() {
  const [allAreas, setAllAreas] = useState<Area[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [type, setType] = useState("strike");
  const [areaSearch, setAreaSearch] = useState("");
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [useCoords, setUseCoords] = useState(false);
  const [coordLat, setCoordLat] = useState("");
  const [coordLng, setCoordLng] = useState("");
  const [coordName, setCoordName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("180");
  const [radius, setRadius] = useState("900");
  const [isUrgent, setIsUrgent] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [autoPostTelegram, setAutoPostTelegram] = useState(true);
  const [editingAlert, setEditingAlert] = useState<AlertItem | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editDuration, setEditDuration] = useState("keep");
  const [editIsUrgent, setEditIsUrgent] = useState(false);
  const [editRadius, setEditRadius] = useState("900");
  const [editType, setEditType] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [listTypeFilter, setListTypeFilter] = useState("all");
  const [listStatusFilter, setListStatusFilter] = useState("all");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAllowed, setIsAllowed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [, setTick] = useState(0);

  const selectedType = useMemo(
    () => ALERT_TYPES.find((item) => item.type === type) || ALERT_TYPES[0],
    [type]
  );

  const filteredAreas = useMemo(() => {
    if (!areaSearch.trim()) return [];
    const alreadySelected = new Set(selectedAreas.map((a) => a.pcode));
    return allAreas.filter(
      (item) => !alreadySelected.has(item.pcode) &&
        (item.name.includes(areaSearch) || item.nameEn.toLowerCase().includes(areaSearch.toLowerCase()) || item.district.includes(areaSearch))
    ).slice(0, 50);
  }, [areaSearch, selectedAreas, allAreas]);

  function addArea(area: Area) {
    if (!selectedAreas.find((a) => a.pcode === area.pcode)) setSelectedAreas((prev) => [...prev, area]);
    setAreaSearch(""); setShowAreaSuggestions(false);
  }
  function removeArea(pcode: string) { setSelectedAreas((prev) => prev.filter((a) => a.pcode !== pcode)); }

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    const { data, error } = await supabase.from("alerts").select("*").order("created_at", { ascending: false });
    if (error) { console.error("Failed to load alerts:", error); setStatusMsg({ text: "خطأ في تحميل الأحداث: " + error.message, ok: false }); }
    else setAlerts(data || []);
    setAlertsLoading(false);
  }, []);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAllowed(!!session); setAuthLoading(false);
      if (session) loadAlerts();
    }
    checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAllowed(!!session); if (session) loadAlerts();
    });
    return () => { listener.subscription.unsubscribe(); };
  }, [loadAlerts]);

  useEffect(() => { try { const t = localStorage.getItem("albayan-templates"); if (t) setTemplates(JSON.parse(t)); } catch {} }, []);
  useEffect(() => { fetch("/data/areas.json").then((r) => r.json()).then(setAllAreas).catch(() => {}); }, []);

  useEffect(() => {
    if (statusMsg && !statusMsg.ok) {
      const timer = setTimeout(() => setStatusMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // Tick every 60s to refresh remaining time badges
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogin() {
    setAuthError(""); setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message === "Invalid login credentials" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : error.message);
    else { setIsAllowed(true); loadAlerts(); }
    setAuthLoading(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); setIsAllowed(false); setAlerts([]); }

  function resetForm() {
    setSelectedAreas([]); setAreaSearch(""); setDescription(""); setDuration("180");
    setRadius(String(selectedType.radius)); setIsUrgent(false);
    setUseCoords(false); setCoordLat(""); setCoordLng(""); setCoordName("");
  }

  function getDurationText(minutes: string) {
    const opt = DURATION_OPTIONS.find((d) => d.value === minutes);
    return opt ? opt.label : minutes + " دقيقة";
  }

  async function publishAlert() {
    if (useCoords) {
      const lat = parseFloat(coordLat), lng = parseFloat(coordLng);
      if (!coordName.trim() || isNaN(lat) || isNaN(lng)) { setStatusMsg({ text: "يرجى إدخال اسم الموقع والإحداثيات", ok: false }); return; }
    } else if (selectedAreas.length === 0) {
      setStatusMsg({ text: "يرجى اختيار بلدة واحدة على الأقل", ok: false }); return;
    }
    setPublishing(true); setStatusMsg(null);
    const expires_at = duration === "permanent" ? null : new Date(Date.now() + Number(duration) * 60000).toISOString();
    const rows = useCoords
      ? [{ title: selectedType.label, area: coordName.trim(), type: selectedType.type, type_label: selectedType.label, color: selectedType.color, description, lat: parseFloat(coordLat), lng: parseFloat(coordLng), radius: Number(radius) || selectedType.radius, expires_at, status: "active", is_urgent: isUrgent }]
      : selectedAreas.map((area) => ({ title: selectedType.label, area: area.name, type: selectedType.type, type_label: selectedType.label, color: selectedType.color, description, lat: area.lat, lng: area.lng, radius: Number(radius) || selectedType.radius, expires_at, status: "active", is_urgent: isUrgent }));
    const { error } = await supabase.from("alerts").insert(rows);
    if (error) { console.error("Insert error:", error); setStatusMsg({ text: "خطأ أثناء النشر: " + error.message, ok: false }); }
    else {
      if (autoPostTelegram) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await fetch("/api/telegram-notify", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token ?? ""}` }, body: JSON.stringify({ alerts: rows.map((r) => ({ ...r, duration_text: getDurationText(duration) })) }) });
        } catch (e) { console.warn("Telegram notification failed:", e); }
      }
      resetForm(); loadAlerts();
      rows.forEach(r => addLog("نشر", r.area));
      setStatusMsg({ text: `تم نشر ${rows.length} حدث على الخريطة بنجاح`, ok: true });
      setTimeout(() => setStatusMsg(null), 4000);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setPublishing(false);
  }

  function startEdit(alert: AlertItem) { setEditingAlert(alert); setEditDescription(alert.description || ""); setEditIsUrgent(alert.is_urgent || false); setEditDuration("keep"); setEditRadius(String(alert.radius || 900)); setEditType(alert.type); }

  async function saveEdit() {
    if (!editingAlert) return;
    const updates: Record<string, unknown> = { description: editDescription, is_urgent: editIsUrgent, radius: Number(editRadius) || editingAlert.radius };
    if (editDuration !== "keep") updates.expires_at = editDuration === "permanent" ? null : new Date(Date.now() + Number(editDuration) * 60000).toISOString();
    if (editType !== editingAlert.type) {
      const newType = ALERT_TYPES.find(t => t.type === editType);
      if (newType) { updates.type = newType.type; updates.type_label = newType.label; updates.color = newType.color; updates.title = newType.label; }
    }
    const { error } = await supabase.from("alerts").update(updates).eq("id", editingAlert.id);
    if (error) setStatusMsg({ text: "خطأ أثناء التعديل: " + error.message, ok: false });
    else { addLog("تعديل", editingAlert.area); setStatusMsg({ text: "تم تعديل الحدث بنجاح", ok: true }); setTimeout(() => setStatusMsg(null), 3000); setEditingAlert(null); loadAlerts(); }
  }

  async function hideAlert(id: number) { const a = alerts.find(x => x.id === id); await supabase.from("alerts").update({ status: "hidden" }).eq("id", id); if (a) addLog("إخفاء", a.area); loadAlerts(); }
  async function showAlert(id: number) { const a = alerts.find(x => x.id === id); await supabase.from("alerts").update({ status: "active" }).eq("id", id); if (a) addLog("إظهار", a.area); loadAlerts(); }
  async function deleteAlert(id: number) { if (!confirm("هل تريد حذف هذا الحدث نهائيًا؟")) return; const a = alerts.find(x => x.id === id); await supabase.from("alerts").delete().eq("id", id); if (a) addLog("حذف", a.area); loadAlerts(); }
  async function clearExpired() { await supabase.from("alerts").delete().not("expires_at", "is", null).lt("expires_at", new Date().toISOString()); addLog("حذف المنتهي", "الكل"); loadAlerts(); }
  async function clearAll() { if (!confirm("هل تريد حذف جميع الأحداث؟ لا يمكن التراجع.")) return; await supabase.from("alerts").delete().gte("id", 0); addLog("حذف الكل", "الكل"); loadAlerts(); }

  const activeCount = alerts.filter((a) => a.status !== "hidden").length;
  const urgentCount = alerts.filter((a) => a.is_urgent).length;
  const hiddenCount = alerts.filter((a) => a.status === "hidden").length;
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (listStatusFilter === "active" && a.status === "hidden") return false;
      if (listStatusFilter === "hidden" && a.status !== "hidden") return false;
      if (listTypeFilter !== "all" && a.type !== listTypeFilter) return false;
      if (listSearch.trim()) {
        const q = listSearch.trim().toLowerCase();
        return a.area.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q) || a.type_label?.includes(listSearch.trim());
      }
      return true;
    });
  }, [alerts, listSearch, listTypeFilter, listStatusFilter]);
  const isFormReady = useCoords ? (!!coordName.trim() && !!coordLat && !!coordLng) : selectedAreas.length > 0;

  const publishRef = useRef(publishAlert);
  publishRef.current = publishAlert;
  const isFormReadyRef = useRef(isFormReady);
  isFormReadyRef.current = isFormReady;

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape" && editingAlert) setEditingAlert(null);
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && isFormReadyRef.current && !publishing) {
        e.preventDefault();
        publishRef.current();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [editingAlert, publishing]);

  /* ── Helper functions for bulk edit, templates, duplication, activity log ── */
  function addLog(action: string, area: string) {
    const entry: LogEntry = { action, area, time: new Date().toLocaleTimeString("ar-LB", { hour: "2-digit", minute: "2-digit" }), admin: email || "admin" };
    setActivityLog(prev => [entry, ...prev].slice(0, 50));
    // Persist to Supabase admin_logs table
    supabase.from("admin_logs").insert({ admin_email: email || "admin", action, area }).then(() => {});
  }

  // Load activity logs from Supabase on mount
  useEffect(() => {
    if (!isAllowed) return;
    supabase.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data) setActivityLog(data.map((d: any) => ({ action: d.action, area: d.area || "", time: new Date(d.created_at).toLocaleTimeString("ar-LB", { hour: "2-digit", minute: "2-digit" }), admin: d.admin_email || "admin" })));
      });
  }, [isAllowed]);

  function saveTemplate() {
    const name = prompt("اسم القالب:");
    if (!name) return;
    const t: Template = { name, type, description, duration, radius, isUrgent };
    const updated = [...templates, t];
    setTemplates(updated);
    try { localStorage.setItem("albayan-templates", JSON.stringify(updated)); } catch {}
  }

  function loadTemplate(t: Template) {
    setType(t.type); setDescription(t.description); setDuration(t.duration); setRadius(t.radius); setIsUrgent(t.isUrgent);
  }

  function deleteTemplate(idx: number) {
    const updated = templates.filter((_: Template, i: number) => i !== idx);
    setTemplates(updated);
    try { localStorage.setItem("albayan-templates", JSON.stringify(updated)); } catch {}
  }

  function duplicateAlert(alert: AlertItem) {
    setType(alert.type);
    setDescription(alert.description || "");
    setIsUrgent(alert.is_urgent || false);
    setRadius(String(alert.radius || 900));
    addLog("تكرار", alert.area);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function selectAllFiltered() {
    if (selectedIds.size === filteredAlerts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredAlerts.map(a => a.id)));
  }

  async function bulkAction(action: "delete" | "hide" | "show" | "urgent") {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (action === "delete") {
      if (!confirm(`حذف ${ids.length} حدث؟`)) return;
      await supabase.from("alerts").delete().in("id", ids);
      addLog(`حذف جماعي (${ids.length})`, "متعدد");
    } else if (action === "hide") {
      await supabase.from("alerts").update({ status: "hidden" }).in("id", ids);
      addLog(`إخفاء جماعي (${ids.length})`, "متعدد");
    } else if (action === "show") {
      await supabase.from("alerts").update({ status: "active" }).in("id", ids);
      addLog(`إظهار جماعي (${ids.length})`, "متعدد");
    } else if (action === "urgent") {
      await supabase.from("alerts").update({ is_urgent: true }).in("id", ids);
      addLog(`عاجل جماعي (${ids.length})`, "متعدد");
    }
    setSelectedIds(new Set());
    loadAlerts();
  }

  /* ── Loading ─────────────────────────────────────────────── */
  if (authLoading) return (
    <main style={{ minHeight: "100vh", background: "#0A1628", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2.5px solid #1E3350", borderTopColor: "#E53935", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "12px", color: "#5A6B80" }}>جاري التحقق...</span>
      </div>
    </main>
  );

  /* ── Login ───────────────────────────────────────────────── */
  if (!isAllowed) return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(229,57,53,0.08) 0%, #0A1628 55%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "inherit" }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(30,51,80,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(30,51,80,0.35) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />
      <div style={{ width: "100%", maxWidth: "400px", background: "#0F1D30", border: "1px solid rgba(229,57,53,0.12)", borderRadius: "24px", padding: "44px 40px", boxShadow: "0 0 0 1px rgba(229,57,53,0.04), 0 40px 80px rgba(0,0,0,0.55)", position: "relative", overflow: "hidden" }}>
        {/* top glow line */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "160px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(229,57,53,0.65), transparent)" }} />

        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ width: "52px", height: "52px", background: "rgba(229,57,53,0.09)", border: "1px solid rgba(229,57,53,0.22)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#E53935" }}>
            <Shield size={22} />
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#E53935", fontWeight: 800, marginBottom: "10px" }}>ALBAYAN ADMIN</div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#F1F5F9", margin: "0 0 8px" }}>دخول لوحة التحكم</h1>
          <p style={{ fontSize: "13px", color: "#5A6B80", margin: 0 }}>للمخوّلين فقط</p>
        </div>

        {authError && (
          <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", color: "#FCA5A5", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
            <X size={13} style={{ flexShrink: 0 }} />{authError}
          </div>
        )}

        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#5A6B80", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "7px" }}>البريد الإلكتروني</div>
          <input type="email" placeholder="admin@albayan-lb.com" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr"
            style={{ ...inp }}
            onFocus={(e) => e.currentTarget.style.borderColor = "#E53935"}
            onBlur={(e) => e.currentTarget.style.borderColor = "#1E3350"} />
        </div>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "10px", color: "#5A6B80", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "7px" }}>كلمة المرور</div>
          <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }} dir="ltr"
            style={{ ...inp }}
            onFocus={(e) => e.currentTarget.style.borderColor = "#E53935"}
            onBlur={(e) => e.currentTarget.style.borderColor = "#1E3350"} />
        </div>

        <button onClick={handleLogin} style={{ width: "100%", background: "linear-gradient(135deg, #E53935 0%, #C62828 100%)", border: "none", borderRadius: "12px", padding: "14px", color: "white", fontSize: "15px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(229,57,53,0.3)", transition: "all 0.2s", marginBottom: "20px" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(229,57,53,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(229,57,53,0.3)"; }}>
          دخول
        </button>
        <div style={{ textAlign: "center" }}>
          <Link href="/" style={{ color: "#5A6B80", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <ArrowLeft size={12} />العودة للخريطة
          </Link>
        </div>
      </div>
    </main>
  );

  /* ── Dashboard ───────────────────────────────────────────── */
  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "#0A1628", color: "#F1F5F9", fontFamily: "inherit" }}>
      <style>{GLOBAL_STYLES}</style>

      {/* Subtle grid bg */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(30,51,80,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(30,51,80,0.2) 1px, transparent 1px)", backgroundSize: "60px 60px", zIndex: 0 }} />

      {/* ── Sticky header ──────────────────────────────────── */}
      <header className="adm-header" style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(10,22,40,0.94)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid #1E3350", height: "60px", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <Link href="/" className="adm-header-nav" style={{ display: "flex", alignItems: "center", gap: "5px", color: "#5A6B80", fontSize: "12px", textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#94A3B8"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#5A6B80"}>
            <ArrowLeft size={13} />الخريطة
          </Link>
          <div className="adm-header-nav" style={{ width: "1px", height: "16px", background: "#1E3350" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{ width: "28px", height: "28px", background: "rgba(229,57,53,0.1)", border: "1px solid rgba(229,57,53,0.22)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#E53935" }}>
              <Shield size={13} />
            </div>
            <span style={{ fontSize: "14px", fontWeight: 800 }}>AlBayan</span>
            <span style={{ color: "#1E3350" }}>/</span>
            <span style={{ fontSize: "13px", color: "#5A6B80" }}>لوحة التحكم</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {activeCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(91,164,230,0.07)", border: "1px solid rgba(91,164,230,0.18)", borderRadius: "20px", padding: "5px 10px" }}>
              <span style={{ fontSize: "11px", color: "#5BA4E6", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{activeCount} نشط</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: "20px", padding: "5px 12px" }}>
            <span style={{ width: "6px", height: "6px", background: "#22C55E", borderRadius: "50%", animation: "pulse 2s infinite", display: "inline-block" }} />
            <span style={{ fontSize: "11px", color: "#22C55E", fontWeight: 700 }}>النظام يعمل</span>
          </div>
          <button onClick={handleLogout} className="adm-btn-ghost" style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "1px solid #1E3350", borderRadius: "8px", padding: "6px 12px", color: "#5A6B80", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
            <LogOut size={12} />خروج
          </button>
        </div>
      </header>

      <div className="adm-body" style={{ position: "relative", zIndex: 1, maxWidth: "1440px", margin: "0 auto", padding: "24px 28px 0" }}>

        {/* ── Toast ──────────────────────────────────────── */}
        {statusMsg && (
          <div style={{ marginBottom: "18px", background: statusMsg.ok ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${statusMsg.ok ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)"}`, borderRadius: "12px", padding: "13px 18px", display: "flex", alignItems: "center", gap: "9px", color: statusMsg.ok ? "#86EFAC" : "#FCA5A5", fontSize: "13px", fontWeight: 700, animation: "slideDown 0.2s ease" }}>
            {statusMsg.ok ? <Check size={14} style={{ flexShrink: 0 }} /> : <AlertTriangle size={14} style={{ flexShrink: 0 }} />}
            <span style={{ flex: 1 }}>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", opacity: 0.6, padding: "2px", display: "flex", flexShrink: 0 }}><X size={13} /></button>
          </div>
        )}

        {/* ── Stats ──────────────────────────────────────── */}
        <div className="adm-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "22px" }}>
          {([
            { label: "الأحداث النشطة", value: activeCount, color: "#22C55E", Icon: Activity },
            { label: "العاجلة", value: urgentCount, color: "#EF4444", Icon: Zap },
            { label: "المخفية", value: hiddenCount, color: "#5A6B80", Icon: EyeOff },
            { label: "الإجمالي", value: alerts.length, color: "#5BA4E6", Icon: Radio },
          ] as const).map(({ label, value, color, Icon }) => (
            <div key={label} className="adm-stat-card" style={{ background: "#0F1D30", border: "1px solid #1E3350", borderRadius: "16px", padding: "18px 20px 16px", position: "relative", overflow: "hidden", cursor: "default" }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${color}55, transparent)` }} />
              <div style={{ width: "30px", height: "30px", background: `${color}12`, border: `1px solid ${color}22`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: "14px" }}>
                <Icon size={14} />
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, lineHeight: 1, marginBottom: "5px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
              <div style={{ fontSize: "12px", color: "#5A6B80" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Main grid ──────────────────────────────────── */}
        <div className="adm-main-grid" style={{ display: "grid", gridTemplateColumns: "390px 1fr", gap: "18px", alignItems: "start" }}>

          {/* ══ CREATE FORM ══════════════════════════════ */}
          <div className="adm-create-form" style={{ background: "#0F1D30", border: "1px solid #1E3350", borderRadius: "20px", overflow: "hidden" }}>
            <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #1E3350", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#E53935", boxShadow: "0 0 7px rgba(229,57,53,0.6)", display: "inline-block" }} />
                <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0 }}>حدث جديد</h2>
              </div>
              {(selectedAreas.length > 0 || description || useCoords) && (
                <button onClick={resetForm} style={{ background: "transparent", border: "1px solid #1E3350", borderRadius: "7px", padding: "4px 10px", color: "#5A6B80", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"; e.currentTarget.style.color = "#EF4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1E3350"; e.currentTarget.style.color = "#5A6B80"; }}>
                  مسح النموذج
                </button>
              )}
            </div>

            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* Alert type grid */}
              <div>
                <SectionLabel>نوع الحدث</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {ALERT_TYPES.map((item) => {
                    const c = TYPE_COLOR[item.type] || "#5BA4E6";
                    const sel = type === item.type;
                    return (
                      <button key={item.type} type="button" className="adm-type-btn"
                        onClick={() => { setType(item.type); setRadius(String(item.radius)); }}
                        style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 11px", background: sel ? `${c}14` : "rgba(10,22,40,0.55)", border: `1px solid ${sel ? `${c}45` : "#1E3350"}`, borderRadius: "9px", color: sel ? c : "#5A6B80", fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "all 0.13s", textAlign: "right" as const, fontFamily: "inherit" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c, flexShrink: 0, boxShadow: sel ? `0 0 5px ${c}` : "none", display: "inline-block" }} />
                        {cleanEmoji(item.label)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div>
                <SectionLabel>الموقع</SectionLabel>
                {/* Mode toggle */}
                <div style={{ display: "flex", background: "rgba(10,22,40,0.7)", border: "1px solid #1E3350", borderRadius: "10px", padding: "3px", marginBottom: "12px" }}>
                  <button type="button" onClick={() => setUseCoords(false)} style={{ flex: 1, padding: "7px 10px", borderRadius: "7px", border: "none", background: !useCoords ? "#E53935" : "transparent", color: !useCoords ? "white" : "#5A6B80", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", transition: "all 0.15s" }}>
                    <MapPin size={11} />بحث بالاسم
                  </button>
                  <button type="button" onClick={() => setUseCoords(true)} style={{ flex: 1, padding: "7px 10px", borderRadius: "7px", border: "none", background: useCoords ? "#1B2D45" : "transparent", color: useCoords ? "#5BA4E6" : "#5A6B80", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", transition: "all 0.15s" }}>
                    <AlertTriangle size={11} />إحداثيات
                  </button>
                </div>

                {!useCoords ? (
                  <>
                    {selectedAreas.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                        {selectedAreas.map((a) => (
                          <span key={a.pcode} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(91,164,230,0.09)", border: "1px solid rgba(91,164,230,0.22)", borderRadius: "6px", padding: "3px 7px 3px 5px", fontSize: "12px", color: "#5BA4E6" }}>
                            {a.name}
                            <button onClick={() => removeArea(a.pcode)} style={{ background: "none", border: "none", color: "#5A6B80", cursor: "pointer", padding: 0, display: "flex", lineHeight: 1 }}><X size={10} /></button>
                          </span>
                        ))}
                        <button onClick={() => setSelectedAreas([])} style={{ background: "none", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "6px", padding: "3px 8px", color: "#EF4444", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>مسح</button>
                      </div>
                    )}
                    <div style={{ position: "relative" }}>
                      <input type="text" value={areaSearch} placeholder="ابحث عن بلدة أو مدينة..."
                        onChange={(e) => { setAreaSearch(e.target.value); setShowAreaSuggestions(true); }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#5BA4E6"; if (areaSearch) setShowAreaSuggestions(true); }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "#1E3350"; setTimeout(() => setShowAreaSuggestions(false), 200); }}
                        onKeyDown={(e) => { if (e.key === "Enter" && filteredAreas.length > 0) { e.preventDefault(); addArea(filteredAreas[0]); } }}
                        style={{ ...inp }} />
                      {showAreaSuggestions && filteredAreas.length > 0 && (
                        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#0F1D30", border: "1px solid #274060", borderRadius: "12px", maxHeight: "210px", overflowY: "auto", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 50 }}>
                          {filteredAreas.map((item, i) => (
                            <button key={item.pcode || `a-${i}`} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addArea(item)}
                              style={{ width: "100%", textAlign: "right" as const, padding: "10px 14px", background: "transparent", border: "none", borderBottom: "1px solid #1E3350", color: "#F1F5F9", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontFamily: "inherit", transition: "background 0.1s" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(30,51,80,0.5)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                              <span style={{ fontWeight: 800 }}>{item.name}</span>
                              <span style={{ fontSize: "11px", color: "#5A6B80" }}>{item.district}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {showAreaSuggestions && areaSearch.trim().length > 1 && filteredAreas.length === 0 && (
                        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#0F1D30", border: "1px solid #274060", borderRadius: "12px", padding: "14px 16px", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 50, textAlign: "center" as const }}>
                          <span style={{ fontSize: "12px", color: "#5A6B80" }}>لا توجد نتائج لـ &quot;{areaSearch}&quot;</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <input type="text" placeholder="اسم الموقع (مثال: منطقة الزهراني)" value={coordName} onChange={(e) => setCoordName(e.target.value)}
                      style={{ ...inp }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#5BA4E6"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#1E3350"} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "10px", color: "#5A6B80", fontWeight: 700, marginBottom: "4px" }}>خط العرض (Lat)</div>
                        <input type="number" placeholder="33.2785" value={coordLat} onChange={(e) => setCoordLat(e.target.value)} dir="ltr" step="any"
                          style={{ ...inp }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "#5BA4E6"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "#1E3350"} />
                      </div>
                      <div>
                        <div style={{ fontSize: "10px", color: "#5A6B80", fontWeight: 700, marginBottom: "4px" }}>خط الطول (Lng)</div>
                        <input type="number" placeholder="35.2037" value={coordLng} onChange={(e) => setCoordLng(e.target.value)} dir="ltr" step="any"
                          style={{ ...inp }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "#5BA4E6"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "#1E3350"} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Duration + Radius */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <SectionLabel>المدة</SectionLabel>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ ...inp, appearance: "none" as const }}>
                    {DURATION_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <SectionLabel>النطاق (م)</SectionLabel>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(10,22,40,0.7)", border: "1px solid #1E3350", borderRadius: "10px", padding: "8px 14px" }}>
                    <input type="range" min="300" max="10000" step="100" value={radius} onChange={(e) => setRadius(e.target.value)}
                      style={{ flex: 1, accentColor: "#5BA4E6", cursor: "pointer" }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#5BA4E6", minWidth: "48px", textAlign: "center" as const, fontVariantNumeric: "tabular-nums" }}>{radius}m</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <SectionLabel>الوصف (اختياري)</SectionLabel>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="تفاصيل الحدث..."
                  style={{ ...inp, resize: "none" as const, lineHeight: "1.65" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#5BA4E6"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#1E3350"} />
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: "10px", padding: "11px 14px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#F1F5F9", marginBottom: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Zap size={12} color="#EF4444" />خبر عاجل
                    </div>
                    <div style={{ fontSize: "11px", color: "#5A6B80" }}>يظهر في شريط التنبيهات</div>
                  </div>
                  <Toggle checked={isUrgent} onChange={setIsUrgent} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,22,40,0.5)", border: "1px solid #1E3350", borderRadius: "10px", padding: "11px 14px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#F1F5F9", marginBottom: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Send size={12} color="#5BA4E6" />نشر على تلغرام
                    </div>
                    <div style={{ fontSize: "11px", color: "#5A6B80" }}>إرسال تلقائي للقناة</div>
                  </div>
                  <Toggle checked={autoPostTelegram} onChange={setAutoPostTelegram} />
                </div>
              </div>

              {/* Templates */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginBottom: "10px" }}>
                <button onClick={saveTemplate} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", background: "rgba(91,164,230,0.07)", border: "1px solid rgba(91,164,230,0.18)", borderRadius: "10px", padding: "9px", color: "#5BA4E6", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <FileText size={12} />حفظ كقالب
                </button>
                {templates.length > 0 && templates.map((t, i) => (
                  <button key={i} onClick={() => loadTemplate(t)} onContextMenu={(e) => { e.preventDefault(); deleteTemplate(i); }}
                    style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(30,51,80,0.45)", border: "1px solid #1E3350", borderRadius: "10px", padding: "7px 12px", color: "#94A3B8", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    title="اضغط لتحميل · اضغط يمين لحذف">
                    {t.name}
                  </button>
                ))}
              </div>
              {/* Publish button */}
              <button onClick={publishAlert} disabled={publishing || !isFormReady} title="Ctrl+Enter"
                style={{ width: "100%", background: publishing || !isFormReady ? "rgba(30,51,80,0.55)" : "linear-gradient(135deg, #E53935 0%, #C62828 100%)", border: `1px solid ${publishing || !isFormReady ? "#1E3350" : "rgba(229,57,53,0.25)"}`, borderRadius: "12px", padding: "13px", color: publishing || !isFormReady ? "#5A6B80" : "white", fontSize: "14px", fontWeight: 800, cursor: publishing || !isFormReady ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: publishing || !isFormReady ? "none" : "0 4px 20px rgba(229,57,53,0.28)", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                onMouseEnter={(e) => { if (!publishing && isFormReady) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(229,57,53,0.38)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = publishing || !isFormReady ? "none" : "0 4px 20px rgba(229,57,53,0.28)"; }}>
                {publishing ? (
                  <><div style={{ width: "13px", height: "13px", border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />جاري النشر...</>
                ) : !isFormReady ? (
                  useCoords ? "أدخل الإحداثيات" : "اختر بلدة أولاً"
                ) : (
                  `نشر ${useCoords ? "الحدث" : selectedAreas.length > 1 ? `${selectedAreas.length} أحداث` : "الحدث"}`
                )}
              </button>
              {isFormReady && !publishing && (
                <div style={{ textAlign: "center", marginTop: "6px", fontSize: "10px", color: "#5A6B80", letterSpacing: "0.05em" }}>
                  ⌘/Ctrl + Enter
                </div>
              )}
            </div>
          </div>

          {/* ══ ALERTS LIST ══════════════════════════════ */}
          <div className="adm-alerts-list" style={{ background: "#0F1D30", border: "1px solid #1E3350", borderRadius: "20px", overflow: "hidden" }}>
            {/* List header */}
            <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #1E3350", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === filteredAlerts.length} onChange={selectAllFiltered}
                  style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "#5BA4E6" }} />
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#5BA4E6", display: "inline-block" }} />
                <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0 }}>إدارة الأحداث</h2>
                {alerts.length > 0 && (
                  <span style={{ background: "rgba(91,164,230,0.1)", border: "1px solid rgba(91,164,230,0.22)", borderRadius: "5px", padding: "2px 8px", fontSize: "11px", color: "#5BA4E6", fontWeight: 700 }}>{alerts.length}</span>
                )}
              </div>
              <div className="adm-list-actions" style={{ display: "flex", gap: "6px" }}>
                <button onClick={loadAlerts} className="adm-btn-ghost" style={{ display: "flex", alignItems: "center", gap: "5px", background: "transparent", border: "1px solid #1E3350", borderRadius: "8px", padding: "6px 12px", color: "#5A6B80", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  <RefreshCw size={11} style={alertsLoading ? { animation: "spin 0.8s linear infinite" } : undefined} />تحديث
                </button>
                <button onClick={clearExpired} className="adm-btn-ghost" style={{ background: "transparent", border: "1px solid #1E3350", borderRadius: "8px", padding: "6px 12px", color: "#5A6B80", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  حذف المنتهي
                </button>
                <button onClick={clearAll} style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "8px", padding: "6px 12px", color: "#EF4444", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  حذف الكل
                </button>
              </div>
            </div>

            {/* Search & Filter bar */}
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #1E3350", display: "flex", gap: "8px", flexWrap: "wrap" as const, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: "140px", position: "relative" as const }}>
                <Search size={13} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#5A6B80" }} />
                <input
                  value={listSearch} onChange={(e) => setListSearch(e.target.value)}
                  placeholder="بحث عن منطقة أو وصف..."
                  style={{ width: "100%", background: "rgba(10,22,40,0.6)", border: "1px solid #1E3350", borderRadius: "8px", padding: "7px 32px 7px 10px", color: "#F1F5F9", fontSize: "12px", fontWeight: 600, fontFamily: "inherit", outline: "none" }}
                />
              </div>
              <select value={listTypeFilter} onChange={(e) => setListTypeFilter(e.target.value)}
                style={{ background: "rgba(10,22,40,0.6)", border: "1px solid #1E3350", borderRadius: "8px", padding: "7px 10px", color: "#F1F5F9", fontSize: "11px", fontWeight: 700, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
                <option value="all">كل الأنواع</option>
                {ALERT_TYPES.map((t) => <option key={t.type} value={t.type}>{cleanEmoji(t.label)}</option>)}
              </select>
              <select value={listStatusFilter} onChange={(e) => setListStatusFilter(e.target.value)}
                style={{ background: "rgba(10,22,40,0.6)", border: "1px solid #1E3350", borderRadius: "8px", padding: "7px 10px", color: "#F1F5F9", fontSize: "11px", fontWeight: 700, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
                <option value="all">الكل ({alerts.length})</option>
                <option value="active">نشطة ({activeCount})</option>
                <option value="hidden">مخفية ({hiddenCount})</option>
              </select>
              {(listSearch || listTypeFilter !== "all" || listStatusFilter !== "all") && (
                <button onClick={() => { setListSearch(""); setListTypeFilter("all"); setListStatusFilter("all"); }}
                  style={{ background: "transparent", border: "1px solid #1E3350", borderRadius: "8px", padding: "6px 10px", color: "#5A6B80", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  مسح
                </button>
              )}
              <span style={{ fontSize: "10px", color: "#5A6B80", fontWeight: 600 }}>{filteredAlerts.length} نتيجة</span>
            </div>

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div style={{ padding: "8px 16px", borderBottom: "1px solid #1E3350", display: "flex", gap: "6px", alignItems: "center", background: "rgba(91,164,230,0.04)" }}>
                <span style={{ fontSize: "11px", color: "#5BA4E6", fontWeight: 700 }}>{selectedIds.size} محدد</span>
                <button onClick={() => bulkAction("show")} style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "6px", padding: "4px 10px", color: "#22C55E", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <Eye size={10} style={{ display: "inline", verticalAlign: "-1px", marginLeft: "4px" }} />إظهار
                </button>
                <button onClick={() => bulkAction("hide")} style={{ background: "rgba(90,107,128,0.07)", border: "1px solid rgba(90,107,128,0.18)", borderRadius: "6px", padding: "4px 10px", color: "#5A6B80", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <EyeOff size={10} style={{ display: "inline", verticalAlign: "-1px", marginLeft: "4px" }} />إخفاء
                </button>
                <button onClick={() => bulkAction("urgent")} style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "6px", padding: "4px 10px", color: "#EF4444", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <Zap size={10} style={{ display: "inline", verticalAlign: "-1px", marginLeft: "4px" }} />عاجل
                </button>
                <button onClick={() => bulkAction("delete")} style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "6px", padding: "4px 10px", color: "#EF4444", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <Trash2 size={10} style={{ display: "inline", verticalAlign: "-1px", marginLeft: "4px" }} />حذف
                </button>
                <button onClick={() => setSelectedIds(new Set())} style={{ background: "transparent", border: "none", color: "#5A6B80", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
              </div>
            )}

            {/* List body */}
            {alertsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2.5px solid #1E3350", borderTopColor: "#5BA4E6", animation: "spin 0.8s linear infinite", marginBottom: "14px" }} />
                <span style={{ fontSize: "12px", color: "#5A6B80" }}>جاري التحميل...</span>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
                <div style={{ width: "48px", height: "48px", background: "rgba(91,164,230,0.06)", border: "1px solid rgba(91,164,230,0.12)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <Search size={20} color="#5A6B80" />
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#F1F5F9", marginBottom: "6px" }}>{listSearch || listTypeFilter !== "all" || listStatusFilter !== "all" ? "لا توجد نتائج" : "لا توجد أحداث"}</h3>
                <p style={{ fontSize: "13px", color: "#5A6B80", margin: 0 }}>{listSearch ? "جرّب كلمة بحث مختلفة" : "أضف أول حدث ليظهر مباشرة على الخريطة"}</p>
              </div>
            ) : (
              <div style={{ maxHeight: "640px", overflowY: "auto" }}>
                {filteredAlerts.map((alert) => {
                  const isHidden = alert.status === "hidden";
                  const c = TYPE_COLOR[alert.type] || "#5BA4E6";
                  return (
                    <div key={alert.id} className="adm-row"
                      style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid #1E3350", opacity: isHidden ? 0.45 : 1, transition: "opacity 0.2s, background 0.12s", background: "transparent" }}>
                      {/* Checkbox */}
                      <div style={{ display: "flex", alignItems: "center", padding: "0 0 0 8px" }}>
                        <input type="checkbox" checked={selectedIds.has(alert.id)} onChange={() => toggleSelect(alert.id)}
                          style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "#5BA4E6" }} />
                      </div>
                      {/* Color stripe */}
                      <div style={{ width: "3px", background: c, flexShrink: 0 }} />
                      {/* Content */}
                      <div style={{ flex: 1, padding: "13px 16px", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px", flexWrap: "wrap" as const }}>
                          <span style={{ background: `${c}13`, border: `1px solid ${c}28`, borderRadius: "5px", padding: "2px 8px", fontSize: "11px", fontWeight: 700, color: c }}>
                            {cleanEmoji(alert.type_label)}
                          </span>
                          {alert.is_urgent && (
                            <span style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "5px", padding: "2px 7px", fontSize: "10px", fontWeight: 800, color: "#FCA5A5", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <Zap size={9} />عاجل
                            </span>
                          )}
                          {isHidden && (
                            <span style={{ background: "rgba(90,107,128,0.1)", border: "1px solid rgba(90,107,128,0.2)", borderRadius: "5px", padding: "2px 7px", fontSize: "10px", fontWeight: 700, color: "#5A6B80" }}>مخفي</span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                          <MapPin size={11} color="#5A6B80" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "#F1F5F9" }}>{alert.area}</span>
                        </div>
                        {alert.description && (
                          <div style={{ fontSize: "12px", color: "#5A6B80", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: "500px" }}>
                            {alert.description}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", flexWrap: "wrap" as const }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={10} color="#5BA4E6" />
                            <span style={{ fontSize: "11px", color: "#5BA4E6", fontWeight: 600 }}>{alert.created_at ? new Date(alert.created_at).toLocaleString("ar-LB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                          </div>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: getRemainingColor(alert.expires_at), background: `${getRemainingColor(alert.expires_at)}11`, border: `1px solid ${getRemainingColor(alert.expires_at)}22`, borderRadius: "4px", padding: "1px 6px" }}>
                            {getRemainingTime(alert.expires_at)}
                          </span>
                          {alert.radius && (
                            <span style={{ fontSize: "10px", fontWeight: 600, color: "#5A6B80" }}>
                              <Ruler size={9} style={{ display: "inline", verticalAlign: "-1px", marginLeft: "2px" }} />{alert.radius}m
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 14px", flexShrink: 0 }}>
                        <button onClick={() => startEdit(alert)} title="تعديل" className="adm-icon-btn"
                          style={{ width: "30px", height: "30px", background: "rgba(229,57,53,0.07)", border: "1px solid rgba(229,57,53,0.18)", borderRadius: "7px", color: "#E53935", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.13s" }}>
                          <Edit3 size={12} />
                        </button>
                        {isHidden ? (
                          <button onClick={() => showAlert(alert.id)} title="إظهار" className="adm-icon-btn"
                            style={{ width: "30px", height: "30px", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: "7px", color: "#22C55E", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.13s" }}>
                            <Eye size={12} />
                          </button>
                        ) : (
                          <button onClick={() => hideAlert(alert.id)} title="إخفاء" className="adm-icon-btn"
                            style={{ width: "30px", height: "30px", background: "rgba(90,107,128,0.07)", border: "1px solid rgba(90,107,128,0.18)", borderRadius: "7px", color: "#5A6B80", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.13s" }}>
                            <EyeOff size={12} />
                          </button>
                        )}
                        <button onClick={() => deleteAlert(alert.id)} title="حذف" className="adm-icon-btn"
                          style={{ width: "30px", height: "30px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.14)", borderRadius: "7px", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.13s" }}>
                          <Trash2 size={12} />
                        </button>
                        <button onClick={() => duplicateAlert(alert)} title="تكرار" className="adm-icon-btn"
                          style={{ width: "30px", height: "30px", background: "rgba(91,164,230,0.05)", border: "1px solid rgba(91,164,230,0.14)", borderRadius: "7px", color: "#5BA4E6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.13s" }}>
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div style={{ background: "#0F1D30", border: "1px solid #1E3350", borderRadius: "20px", overflow: "hidden", marginTop: "24px" }}>
          <button onClick={() => setShowLog(!showLog)}
            style={{ width: "100%", padding: "14px 22px", borderBottom: showLog ? "1px solid #1E3350" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <List size={13} color="#5BA4E6" />
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#F1F5F9" }}>سجل النشاط</span>
              {activityLog.length > 0 && <span style={{ background: "rgba(91,164,230,0.1)", border: "1px solid rgba(91,164,230,0.22)", borderRadius: "5px", padding: "1px 6px", fontSize: "10px", color: "#5BA4E6", fontWeight: 700 }}>{activityLog.length}</span>}
            </div>
            <span style={{ color: "#5A6B80", fontSize: "11px" }}>{showLog ? "▲" : "▼"}</span>
          </button>
          {showLog && (
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {activityLog.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#5A6B80", fontSize: "12px" }}>لا يوجد نشاط بعد</div>
              ) : activityLog.map((log, i) => (
                <div key={i} style={{ padding: "10px 22px", borderBottom: "1px solid #1E3350", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                    <Activity size={11} color="#5A6B80" />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#F1F5F9" }}>{log.action}</span>
                    <span style={{ fontSize: "11px", color: "#5A6B80" }}>— {log.area}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <span style={{ fontSize: "9px", color: "#5BA4E6", background: "rgba(91,164,230,0.08)", borderRadius: "4px", padding: "2px 6px", fontWeight: 700 }}>{log.admin}</span>
                    <span style={{ fontSize: "10px", color: "#5A6B80" }}>{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "20px 0" }}><Footer /></div>
      </div>

      {/* ── Edit modal ─────────────────────────────────────── */}
      {editingAlert && (
        <div onClick={() => setEditingAlert(null)} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", animation: "fadeIn 0.15s ease" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "520px", background: "#0F1D30", border: "1px solid #274060", borderRadius: "24px", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.6)", animation: "slideDown 0.2s ease", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #1E3350", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 5px" }}>تعديل الحدث</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#5A6B80" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: TYPE_COLOR[editType] || "#5BA4E6", display: "inline-block" }} />
                  <MapPin size={10} />{editingAlert.area}
                </div>
              </div>
              <button onClick={() => setEditingAlert(null)}
                style={{ width: "32px", height: "32px", background: "rgba(90,107,128,0.08)", border: "1px solid #1E3350", borderRadius: "8px", color: "#5A6B80", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={13} />
              </button>
            </div>
            <div className="adm-modal-body" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#5A6B80", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>نوع الحدث</div>
                <div className="adm-modal-type-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "5px" }}>
                  {ALERT_TYPES.map((item) => {
                    const c = TYPE_COLOR[item.type] || "#5BA4E6";
                    const sel = editType === item.type;
                    return (
                      <button key={item.type} type="button" onClick={() => setEditType(item.type)}
                        style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 9px", background: sel ? `${c}14` : "rgba(10,22,40,0.55)", border: `1px solid ${sel ? `${c}45` : "#1E3350"}`, borderRadius: "7px", color: sel ? c : "#5A6B80", fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.13s", textAlign: "right" as const, fontFamily: "inherit" }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: c, flexShrink: 0, display: "inline-block" }} />
                        {cleanEmoji(item.label)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#5A6B80", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>الوصف</div>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4}
                  style={{ ...inp, resize: "none" as const, lineHeight: "1.65" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#5BA4E6"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#1E3350"} />
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#5A6B80", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>تمديد المدة</div>
                <select value={editDuration} onChange={(e) => setEditDuration(e.target.value)} style={{ ...inp, appearance: "none" as const }}>
                  <option value="keep">إبقاء المدة الحالية</option>
                  {DURATION_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#5A6B80", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>نطاق التأثير (متر)</div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input type="range" min="500" max="10000" step="100" value={editRadius} onChange={(e) => setEditRadius(e.target.value)}
                    style={{ flex: 1, accentColor: "#5BA4E6" }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#5BA4E6", minWidth: "50px", textAlign: "center" as const }}>{editRadius}m</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.11)", borderRadius: "10px", padding: "12px 14px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#F1F5F9", marginBottom: "2px", display: "flex", alignItems: "center", gap: "6px" }}><Zap size={12} color="#EF4444" />خبر عاجل</div>
                  <div style={{ fontSize: "11px", color: "#5A6B80" }}>يظهر في شريط التنبيهات</div>
                </div>
                <Toggle checked={editIsUrgent} onChange={setEditIsUrgent} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={saveEdit}
                  style={{ flex: 1, background: "linear-gradient(135deg, #E53935, #C62828)", border: "none", borderRadius: "12px", padding: "13px", color: "white", fontSize: "14px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(229,57,53,0.25)" }}>
                  حفظ التعديلات
                </button>
                <button onClick={() => setEditingAlert(null)}
                  style={{ flex: 1, background: "rgba(30,51,80,0.45)", border: "1px solid #1E3350", borderRadius: "12px", padding: "13px", color: "#94A3B8", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}