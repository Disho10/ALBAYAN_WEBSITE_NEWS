"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Settings, Menu, X, LocateFixed, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import type { AlertItem } from "@/app/lib/types";
import { TELEGRAM_CHANNEL_URL, WHATSAPP_URL } from "@/app/lib/types";

type UserSettings = {
  soundEnabled: boolean;
  urgentBar: boolean;
  highlightAreas: boolean;
  selectedArea: string;
  enabledAlertTypes: string[];
};

const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true, urgentBar: true, highlightAreas: true,
  selectedArea: "صور", enabledAlertTypes: [],
};

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const s = localStorage.getItem("albayan-settings");
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function createCircleGeoJSON(lng: number, lat: number, radiusInMeters: number) {
  const points = 64, coords = [], R = 6371000;
  const latR = (lat * Math.PI) / 180, lngR = (lng * Math.PI) / 180;
  for (let i = 0; i <= points; i++) {
    const a = (i * 2 * Math.PI) / points;
    const nLat = Math.asin(Math.sin(latR) * Math.cos(radiusInMeters / R) + Math.cos(latR) * Math.sin(radiusInMeters / R) * Math.cos(a));
    const nLng = lngR + Math.atan2(Math.sin(a) * Math.sin(radiusInMeters / R) * Math.cos(latR), Math.cos(radiusInMeters / R) - Math.sin(latR) * Math.sin(nLat));
    coords.push([(nLng * 180) / Math.PI, (nLat * 180) / Math.PI]);
  }
  return { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: {} };
}

function getRemainingTime(expiresAt?: string | null) {
  if (!expiresAt) return "دائم";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "انتهى";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "أقل من دقيقة";
  if (m < 60) return `${m} د`;
  const h = Math.floor(m / 60), rm = m % 60;
  return rm === 0 ? `${h} س` : `${h} س ${rm} د`;
}

function getTimeAgo(createdAt?: string) {
  if (!createdAt) return "";
  const diff = Date.now() - new Date(createdAt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  return `منذ ${Math.floor(h / 24)} ي`;
}

function matchesFilter(alert: AlertItem, filter: string) {
  if (filter === "all") return true;
  if (filter === "strikes") return alert.type === "strike" || alert.type === "artillery";
  if (filter === "siren") return alert.type === "siren" || alert.type === "siren_missile" || alert.type === "siren_drone";
  return alert.type === filter;
}

function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = "sine"; gain.gain.value = 0.12;
    osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => {
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.connect(g2); g2.connect(ctx.destination);
      o2.frequency.value = 1100; o2.type = "sine"; g2.gain.value = 0.12;
      o2.start(); g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      o2.stop(ctx.currentTime + 0.8);
    }, 180);
  } catch {}
}

const TYPE_COLORS: Record<string, string> = {
  strike: "#EF4444", artillery: "#DC2626", drone: "#5BA4E6",
  threat: "#F59E0B", enemy_position: "#A855F7", army_position: "#22C55E",
  traffic: "#38BDF8", crowd: "#DC2626", fire: "#F97316", injuries: "#E11D48",
  siren: "#E53935", siren_missile: "#E53935", siren_drone: "#E53935",
};

function cleanLabel(label: string) {
  return label.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, "").trim();
}

function createAlertPopupHTML(alert: AlertItem) {
  const remaining = getRemainingTime(alert.expires_at);
  const color = TYPE_COLORS[alert.type] || "#5BA4E6";
  const label = cleanLabel(alert.type_label);
  return `
    <div dir="rtl" style="width:260px;background:#162236;color:#F1F5F9;border:1px solid #243447;border-radius:16px;overflow:hidden;font-family:inherit;box-shadow:0 16px 40px rgba(0,0,0,0.4);">
      <div style="height:4px;background:${color};"></div>
      <div style="padding:14px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <span style="background:${color}18;color:${color};border:1px solid ${color}44;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;">${label}</span>
          <span style="color:#5A6B80;font-size:11px;">البيان الإخباري</span>
        </div>
        <h3 style="margin:0;font-size:18px;font-weight:800;line-height:1.5;">${alert.area}</h3>
        <p style="margin:8px 0 0;color:#8B9BB4;font-size:13px;line-height:1.8;">${alert.description || "لا توجد تفاصيل إضافية."}</p>
        <div style="margin-top:14px;background:#0D1B2A;border:1px solid #243447;border-radius:10px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#5A6B80;font-size:11px;">المدة المتبقية</span>
          <span style="color:#F59E0B;font-weight:700;font-size:13px;">${remaining}</span>
        </div>
        <a href="${TELEGRAM_CHANNEL_URL}" target="_blank" rel="noopener noreferrer" style="display:block;margin-top:12px;text-align:center;background:#E53935;color:white;text-decoration:none;font-weight:700;padding:8px;border-radius:10px;font-size:13px;">تابعنا على تلغرام</a>
      </div>
    </div>
  `;
}

export default function Home() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  const strikeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const activeLayerIdsRef = useRef<string[]>([]);
  const activeSourceIdsRef = useRef<string[]>([]);
  const cleanupHandlersRef = useRef<(() => void)[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const prevAlertIdsRef = useRef<Set<number>>(new Set());

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [, forceUpdate] = useState(0);

  const visibleAlerts = useMemo(() => alerts.filter((a) => matchesFilter(a, activeFilter)), [alerts, activeFilter]);
  const urgentAlerts = useMemo(() => alerts.filter((a) => a.is_urgent), [alerts]);
  const sirenCount = useMemo(() => alerts.filter((a) => a.type === "siren_missile" || a.type === "siren_drone" || a.type === "siren").length, [alerts]);

  useEffect(() => { setUserSettings(loadSettings()); }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const { data, error: e } = await supabase.from("alerts").select("*").eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).order("created_at", { ascending: false });
      if (e) throw e;
      const newAlerts = data || [];
      if (userSettings.soundEnabled) {
        const prev = prevAlertIdsRef.current;
        for (const a of newAlerts) { if (a.is_urgent && !prev.has(a.id)) { playAlertSound(); break; } }
        prevAlertIdsRef.current = new Set(newAlerts.map((a) => a.id));
      }
      setAlerts(newAlerts); setError(null);
    } catch { setError("تعذر تحميل التنبيهات"); } finally { setLoading(false); }
  }, [userSettings.soundEnabled]);

  function showAlertPopup(alert: AlertItem, lngLat: maplibregl.LngLatLike) {
    const map = mapInstance.current; if (!map) return;
    if (activePopupRef.current) activePopupRef.current.remove();
    activePopupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 18 })
      .setLngLat(lngLat).setHTML(createAlertPopupHTML(alert)).addTo(map);
  }

  function openAlert(alert: AlertItem) {
    const map = mapInstance.current; if (!map) return;
    map.flyTo({ center: [alert.lng, alert.lat], zoom: 13.5, speed: 1.2 });
    showAlertPopup(alert, [alert.lng, alert.lat]);
    setMobileSheetOpen(false);
  }

  function locateUser() {
    const map = mapInstance.current; if (!map) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { longitude, latitude } = pos.coords;
      map.flyTo({ center: [longitude, latitude], zoom: 13, speed: 1.4 });
      if (userMarkerRef.current) userMarkerRef.current.remove();
      const el = document.createElement("div");
      el.style.cssText = "width:16px;height:16px;background:#5BA4E6;border:2.5px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(91,164,230,0.25)";
      userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(map);
    }, () => {}, { enableHighAccuracy: true, timeout: 8000 });
  }

  useEffect(() => {
    loadAlerts();
    const ch = supabase.channel("alerts-rt").on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => loadAlerts()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadAlerts]);

  useEffect(() => { const t = setInterval(() => { loadAlerts(); forceUpdate((v) => v + 1); }, 60000); return () => clearInterval(t); }, [loadAlerts]);

  useEffect(() => {
    if (!mapRef.current) return;
    const rtl = maplibregl.getRTLTextPluginStatus();
    if (rtl === "unavailable") maplibregl.setRTLTextPlugin("https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js", true);

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
      center: [35.22, 33.27], zoom: 11, minZoom: 6, maxZoom: 15,
    });
    mapInstance.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-left");

    map.on("load", async () => {
      try {
        const res = await fetch("/data/lbn_admin3.geojson");
        if (res.ok) { const d = await res.json(); if (!map.getSource("admin3")) map.addSource("admin3", { type: "geojson", data: d }); }
      } catch {}
      try {
        const res = await fetch("/data/israel_areas.geojson");
        if (res.ok) { const d = await res.json(); if (!map.getSource("israel-areas")) map.addSource("israel-areas", { type: "geojson", data: d }); }
      } catch {}
      const readyTimeout = setTimeout(() => setMapReady(true), 2000);
      map.once("idle", () => { clearTimeout(readyTimeout); setMapReady(true); });
    });
    map.on("error", (e) => console.error("Map error:", e));
    return () => map.remove();
  }, []);

  // Render alerts on map
  useEffect(() => {
    const map = mapInstance.current; if (!map || !mapReady) return;

    cleanupHandlersRef.current.forEach((c) => c()); cleanupHandlersRef.current = [];
    strikeMarkersRef.current.forEach((m) => m.remove()); strikeMarkersRef.current = [];
    activeLayerIdsRef.current.forEach((id) => { if (map.getLayer(id)) map.removeLayer(id); }); activeLayerIdsRef.current = [];
    activeSourceIdsRef.current.forEach((id) => { if (map.getSource(id)) map.removeSource(id); }); activeSourceIdsRef.current = [];

    visibleAlerts.forEach((alert) => {
      const isStrike = alert.type === "strike" || alert.type === "artillery";
      const isAreaHighlight = alert.type === "threat" || alert.type === "enemy_position" || alert.type === "army_position";
      const isSiren = alert.type === "siren" || alert.type === "siren_missile" || alert.type === "siren_drone";

      if (isStrike) {
        const same = visibleAlerts.filter((a) => (a.type === "strike" || a.type === "artillery") && a.area === alert.area);
        const idx = same.findIndex((a) => a.id === alert.id);
        const off = 0.0035;
        const pos = [[0,0],[off,0],[-off,0],[0,off],[0,-off],[off,off],[-off,-off]][idx % 7];
        const mLng = alert.lng + pos[0], mLat = alert.lat + pos[1];
        const el = document.createElement("div");
        el.className = "strike-marker";
        el.addEventListener("click", (e) => { e.stopPropagation(); showAlertPopup(alert, [mLng, mLat]); });
        strikeMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([mLng, mLat]).addTo(map));
        return;
      }

      if (isSiren) {
        const srcId = `siren-src-${alert.id}`, fillId = `siren-fill-${alert.id}`, lineId = `siren-line-${alert.id}`;
        const circle = createCircleGeoJSON(alert.lng, alert.lat, alert.radius || 3000);
        map.addSource(srcId, { type: "geojson", data: circle as any }); activeSourceIdsRef.current.push(srcId);
        map.addLayer({ id: fillId, type: "fill", source: srcId, paint: { "fill-color": "#E53935", "fill-opacity": 0.3 } });
        map.addLayer({ id: lineId, type: "line", source: srcId, paint: { "line-color": "#E53935", "line-width": 2, "line-dasharray": [3, 2] } });
        const el = document.createElement("div"); el.className = "siren-marker";
        const isDrone = alert.type === "siren_drone";
        el.innerHTML = isDrone
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="12,3 4,14 8,14 8,12 12,8 16,12 16,14 20,14"/><rect x="11" y="14" width="2" height="7" rx="1"/><polygon points="7,16 12,21 17,16"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2c-.5 0-1 .2-1.3.6L8 7v3L5 13v2h4l-1 5.5c-.1.8.6 1.5 1.4 1.5h5.2c.8 0 1.5-.7 1.4-1.5L15 15h4v-2l-3-3V7l-2.7-4.4C13 2.2 12.5 2 12 2z"/></svg>';
        el.addEventListener("click", (e) => { e.stopPropagation(); showAlertPopup(alert, [alert.lng, alert.lat]); });
        strikeMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([alert.lng, alert.lat]).addTo(map));
        const ch = (e: maplibregl.MapLayerMouseEvent) => showAlertPopup(alert, e.lngLat);
        const me = () => { map.getCanvas().style.cursor = "pointer"; }; const ml = () => { map.getCanvas().style.cursor = ""; };
        map.on("click", fillId, ch); map.on("mouseenter", fillId, me); map.on("mouseleave", fillId, ml);
        cleanupHandlersRef.current.push(() => { map.off("click", fillId, ch); map.off("mouseenter", fillId, me); map.off("mouseleave", fillId, ml); });
        activeLayerIdsRef.current.push(fillId, lineId);
        return;
      }

      if (isAreaHighlight && userSettings.highlightAreas) {
        const fId = `area-${alert.id}`, lId = `area-line-${alert.id}`;
        const color = alert.type === "threat" ? "#F59E0B" : alert.type === "enemy_position" ? "#A855F7" : "#22C55E";
        map.addLayer({ id: fId, type: "fill", source: "admin3", paint: { "fill-color": color, "fill-opacity": 0.4 }, filter: ["==", ["get", "adm3_name1"], alert.area] });
        map.addLayer({ id: lId, type: "line", source: "admin3", paint: { "line-color": color, "line-width": 2.5 }, filter: ["==", ["get", "adm3_name1"], alert.area] });
        const ch = (e: maplibregl.MapLayerMouseEvent) => showAlertPopup(alert, e.lngLat);
        const me = () => { map.getCanvas().style.cursor = "pointer"; }; const ml = () => { map.getCanvas().style.cursor = ""; };
        map.on("click", fId, ch); map.on("mouseenter", fId, me); map.on("mouseleave", fId, ml);
        cleanupHandlersRef.current.push(() => { map.off("click", fId, ch); map.off("mouseenter", fId, me); map.off("mouseleave", fId, ml); });
        activeLayerIdsRef.current.push(fId, lId);
        return;
      }

      const srcId = `src-${alert.id}`, fId = `fill-${alert.id}`, lId = `line-${alert.id}`;
      const circle = createCircleGeoJSON(alert.lng, alert.lat, alert.radius || 800);
      map.addSource(srcId, { type: "geojson", data: circle as any }); activeSourceIdsRef.current.push(srcId);
      map.addLayer({ id: fId, type: "fill", source: srcId, paint: { "fill-color": alert.color || "#5BA4E6", "fill-opacity": 0.25 } });
      map.addLayer({ id: lId, type: "line", source: srcId, paint: { "line-color": alert.color || "#5BA4E6", "line-width": 1.5 } });
      const ch = (e: maplibregl.MapLayerMouseEvent) => showAlertPopup(alert, e.lngLat);
      const me = () => { map.getCanvas().style.cursor = "pointer"; }; const ml = () => { map.getCanvas().style.cursor = ""; };
      map.on("click", fId, ch); map.on("mouseenter", fId, me); map.on("mouseleave", fId, ml);
      cleanupHandlersRef.current.push(() => { map.off("click", fId, ch); map.off("mouseenter", fId, me); map.off("mouseleave", fId, ml); });
      activeLayerIdsRef.current.push(fId, lId);
    });
  }, [visibleAlerts, mapReady, userSettings.highlightAreas]);

  const filters = [
    { value: "all", label: "الكل" }, { value: "strikes", label: "غارات" },
    { value: "drone", label: "مسيّرات" }, { value: "threat", label: "تهديدات" },
    { value: "enemy_position", label: "تمركز" }, { value: "army_position", label: "الجيش" },
    { value: "siren", label: "صافرات" }, { value: "traffic", label: "حوادث" },
    { value: "crowd", label: "اشتباكات" },
  ];

  return (
    <main className="h-screen bg-[#0D1B2A] text-[#F1F5F9]" dir="rtl">
      {/* HEADER — 56px, premium, logo-driven */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-[#243447] bg-[#111D2E]/95 backdrop-blur-lg relative z-50">
        <div className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="البيان الإخباري" width={36} height={36} className="rounded-lg" />
          <div className="hidden sm:block">
            <h1 className="text-base font-bold leading-tight">البيان الإخباري</h1>
            <p className="text-[10px] text-[#5A6B80] leading-tight">من قلب الحدث</p>
          </div>
        </div>

        {/* Status bar */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-[#8B9BB4]">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />متصل</span>
          <span className="text-[#243447]">|</span>
          <span>تغطية لبنان</span>
          {sirenCount > 0 && (<><span className="text-[#243447]">|</span><span className="text-[#E53935] font-bold">صافرات في {sirenCount} مناطق</span></>)}
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link href="/settings" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1B2D45] transition text-[#8B9BB4] hover:text-white"><Settings size={16} /></Link>
          <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="h-8 px-3 flex items-center rounded-lg text-xs font-bold bg-[#1B3A5C] text-[#5BA4E6] hover:bg-[#1B3A5C]/80 transition">تلغرام</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="h-8 px-3 flex items-center rounded-lg text-xs font-bold bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 transition">واتساب</a>
          <Link href="/donate" className="h-8 px-3 flex items-center rounded-lg text-xs font-bold bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935]/20 transition">ادعمنا</Link>
          <Link href="/report" className="h-8 px-3 flex items-center rounded-lg text-xs font-bold bg-white/5 text-white hover:bg-white/10 transition">بلاغ</Link>
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1B2D45] text-[#8B9BB4]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {mobileMenuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-[#111D2E] border-b border-[#243447] p-3 flex flex-col gap-1.5 md:hidden z-50">
            <Link href="/report" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold bg-white/5 hover:bg-white/10 transition">بلاغ</Link>
            <Link href="/donate" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold bg-[#E53935]/10 text-[#E53935] hover:bg-[#E53935]/20 transition">ادعمنا</Link>
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg px-4 py-2.5 text-center text-sm font-bold bg-[#1B3A5C] text-[#5BA4E6] hover:bg-[#1B3A5C]/80 transition">تلغرام</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg px-4 py-2.5 text-center text-sm font-bold bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 transition">واتساب</a>
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold hover:bg-[#1B2D45] transition">الإعدادات</Link>
          </div>
        )}
      </header>

      <div className="relative h-[calc(100vh-56px)] w-full">
        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 z-40 bg-[#0D1B2A] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-3 border-[#243447] border-t-[#E53935] rounded-full animate-spin" />
            <p className="text-sm text-[#5A6B80]">جاري التحميل...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute top-0 left-0 right-0 z-30 bg-[#E53935] text-white px-4 py-2 text-center text-xs font-bold">
            {error} <button onClick={loadAlerts} className="mr-2 underline">إعادة المحاولة</button>
          </div>
        )}

        {/* Urgent bar */}
        {userSettings.urgentBar && urgentAlerts.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-30 bg-[#E53935] text-white h-10 flex items-center justify-center">
            <span className="relative flex h-2 w-2 ml-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-white" /></span>
            <span className="font-black text-sm ml-2">عاجل</span>
            <span className="text-sm font-bold">{cleanLabel(urgentAlerts[0].type_label)} — {urgentAlerts[0].area}</span>
          </div>
        )}

        {/* Filter chips */}
        <div className={`absolute left-1/2 -translate-x-1/2 z-20 flex gap-1.5 rounded-lg border border-[#243447] bg-[#111D2E]/95 backdrop-blur-md px-2 py-1.5 max-w-[calc(100vw-24px)] overflow-x-auto filter-scroll ${userSettings.urgentBar && urgentAlerts.length > 0 ? "top-14" : "top-3"}`}>
          {filters.map((f) => (
            <button key={f.value} onClick={() => setActiveFilter(f.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap flex-shrink-0 transition ${activeFilter === f.value ? "bg-[#E53935] text-white" : "text-[#8B9BB4] hover:text-white hover:bg-[#1B2D45]"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Map */}
        <div ref={mapRef} className="h-full w-full" />

        {/* Locate button */}
        <button onClick={locateUser} className="absolute bottom-4 right-4 z-20 w-10 h-10 bg-[#111D2E]/95 backdrop-blur-md hover:bg-[#1B2D45] border border-[#243447] rounded-lg flex items-center justify-center transition" title="موقعي">
          <LocateFixed size={18} className="text-[#5BA4E6]" />
        </button>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-[#243447] bg-[#111D2E]/95 backdrop-blur-md p-3 hidden sm:block">
          <h3 className="font-bold text-xs mb-2 text-[#8B9BB4]">مفتاح الخريطة</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#EF4444]" /><span>غارة / قصف</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#F59E0B]" /><span>تهديد</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#A855F7]" /><span>تمركز العدو</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#22C55E]" /><span>الجيش اللبناني</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#5BA4E6]" /><span>مسيّرات</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded border border-dashed border-[#E53935] bg-[#E53935]/30" /><span>صافرات إنذار</span></div>
          </div>
        </div>

        {/* Events panel - works on both desktop and mobile */}
        <div className={`absolute right-4 z-10 ${userSettings.urgentBar && urgentAlerts.length > 0 ? "top-16" : "top-3"}`}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-2 border border-[#243447] bg-[#111D2E]/95 backdrop-blur-md px-3 py-2 text-xs transition hover:bg-[#1B2D45] ${sidebarOpen ? "rounded-t-lg border-b-0 w-64 md:w-72" : "rounded-lg"}`}>
            <span className="bg-[#E53935] text-white text-[10px] px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{visibleAlerts.length}</span>
            <span className="flex-1 text-right">{sidebarOpen ? "الأحداث المباشرة" : "الأحداث"}</span>
            {sidebarOpen ? <ChevronUp size={14} className="text-[#64748B]" /> : <ChevronDown size={14} className="text-[#64748B]" />}
          </button>

          {sidebarOpen && (
            <div className="w-64 md:w-72 max-h-[50vh] md:max-h-[calc(100vh-160px)] overflow-y-auto rounded-b-lg border border-[#243447] border-t-0 bg-[#111D2E]/95 backdrop-blur-md">
              <div className="p-2 space-y-1.5">
                {visibleAlerts.length === 0 ? (
                  <p className="text-xs text-[#64748B] text-center py-8">لا توجد أحداث حالياً</p>
                ) : visibleAlerts.map((alert) => {
                  const color = TYPE_COLORS[alert.type] || "#5BA4E6";
                  return (
                    <button key={alert.id} onClick={() => openAlert(alert)}
                      className="w-full text-right rounded-lg bg-[#162236] hover:bg-[#1B2D45] p-3 border border-[#243447] transition relative overflow-hidden">
                      <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-lg" style={{ backgroundColor: color }} />
                      <div className="pr-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs">{cleanLabel(alert.type_label)}</span>
                          <span className="text-[10px] text-[#64748B]">{getTimeAgo(alert.created_at)}</span>
                        </div>
                        <div className="text-sm mt-1">{alert.area}</div>
                        {alert.description && <div className="text-[11px] text-[#94A3B8] mt-1 line-clamp-1">{alert.description}</div>}
                        <div className="text-[10px] text-[#F59E0B] mt-1.5">ينتهي بعد: {getRemainingTime(alert.expires_at)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>


      </div>
    </main>
  );
}
