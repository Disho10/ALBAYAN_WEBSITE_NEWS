"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Settings, Menu, X, LocateFixed, ChevronUp, ChevronDown,
  Sun, Moon, Layers, Filter, Plus, Minus, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import type { AlertItem } from "@/app/lib/types";
import { TELEGRAM_CHANNEL_URL, WHATSAPP_URL } from "@/app/lib/types";
import { useTheme } from "@/app/components/ThemeProvider";

/* ─── Types ─────────────────────────────────────────── */
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
  enabledAlertTypes: [],
};

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const s = localStorage.getItem("albayan-settings");
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_SETTINGS;
}

/* ─── Geometry ──────────────────────────────────────── */
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

/* ─── Helpers ───────────────────────────────────────── */
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

function getPopupBg(theme: string) {
  return theme === "light" ? "#FFFFFF" : "#152238";
}
function getPopupBorder(theme: string) {
  return theme === "light" ? "#DDE3ED" : "#1E3350";
}
function getPopupText(theme: string) {
  return theme === "light" ? "#0F172A" : "#F1F5F9";
}
function getPopupMuted(theme: string) {
  return theme === "light" ? "#64748B" : "#5A6B80";
}
function getPopupSubBg(theme: string) {
  return theme === "light" ? "#F6F8FB" : "#0D1B2A";
}

function createAlertPopupHTML(alert: AlertItem, theme: string) {
  const remaining = getRemainingTime(alert.expires_at);
  const color = TYPE_COLORS[alert.type] || "#5BA4E6";
  const label = cleanLabel(alert.type_label);
  const bg = getPopupBg(theme);
  const border = getPopupBorder(theme);
  const text = getPopupText(theme);
  const muted = getPopupMuted(theme);
  const subBg = getPopupSubBg(theme);
  return `
    <div dir="rtl" style="width:260px;background:${bg};color:${text};border:1px solid ${border};border-radius:14px;overflow:hidden;font-family:inherit;box-shadow:0 12px 32px rgba(0,0,0,${theme === "light" ? "0.1" : "0.4"});">
      <div style="height:3px;background:${color};"></div>
      <div style="padding:14px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <span style="background:${color}14;color:${color};border:1px solid ${color}33;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;">${label}</span>
          <span style="color:${muted};font-size:10px;">البيان الإخباري</span>
        </div>
        <h3 style="margin:0;font-size:16px;font-weight:800;line-height:1.5;">${alert.area}</h3>
        <p style="margin:6px 0 0;color:${muted};font-size:12px;line-height:1.8;">${alert.description || "لا توجد تفاصيل إضافية."}</p>
        <div style="margin-top:12px;background:${subBg};border:1px solid ${border};border-radius:8px;padding:6px 10px;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:${muted};font-size:10px;">المدة المتبقية</span>
          <span style="color:#F59E0B;font-weight:700;font-size:12px;">${remaining}</span>
        </div>
      </div>
    </div>
  `;
}

/* ─── Filters ───────────────────────────────────────── */
const FILTERS = [
  { value: "all", label: "الكل" },
  { value: "strikes", label: "غارات", color: "#EF4444" },
  { value: "drone", label: "مسيّرات", color: "#5BA4E6" },
  { value: "threat", label: "تهديدات", color: "#F59E0B" },
  { value: "enemy_position", label: "تمركز العدو", color: "#A855F7" },
  { value: "army_position", label: "الجيش", color: "#22C55E" },
  { value: "siren", label: "صافرات", color: "#E53935" },
  { value: "traffic", label: "حوادث", color: "#38BDF8" },
  { value: "crowd", label: "اشتباكات", color: "#DC2626" },
];

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function Home() {
  const { theme, toggleTheme } = useTheme();

  /* Map refs */
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  const strikeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const activeLayerIdsRef = useRef<string[]>([]);
  const activeSourceIdsRef = useRef<string[]>([]);
  const cleanupHandlersRef = useRef<(() => void)[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const prevAlertIdsRef = useRef<Set<number>>(new Set());

  /* State */
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [, forceUpdate] = useState(0);

  /* Derived */
  const visibleAlerts = useMemo(() => alerts.filter((a) => matchesFilter(a, activeFilter)), [alerts, activeFilter]);
  const urgentAlerts = useMemo(() => alerts.filter((a) => a.is_urgent), [alerts]);
  const sirenCount = useMemo(() => alerts.filter((a) => a.type === "siren_missile" || a.type === "siren_drone" || a.type === "siren").length, [alerts]);

  useEffect(() => { setUserSettings(loadSettings()); }, []);

  /* ── Data loading ─────────────────────────────────── */
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
      setAlerts(newAlerts);
      setError(null);
    } catch { setError("تعذر تحميل التنبيهات"); } finally { setLoading(false); }
  }, [userSettings.soundEnabled]);

  /* ── Popups ───────────────────────────────────────── */
  function showAlertPopup(alert: AlertItem, lngLat: maplibregl.LngLatLike) {
    const map = mapInstance.current; if (!map) return;
    if (activePopupRef.current) activePopupRef.current.remove();
    activePopupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 16 })
      .setLngLat(lngLat).setHTML(createAlertPopupHTML(alert, theme)).addTo(map);
  }

  function openAlert(alert: AlertItem) {
    const map = mapInstance.current; if (!map) return;
    map.flyTo({ center: [alert.lng, alert.lat], zoom: 13.5, speed: 1.2 });
    showAlertPopup(alert, [alert.lng, alert.lat]);
  }

  function locateUser() {
    const map = mapInstance.current; if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { longitude, latitude } = pos.coords;
      map.flyTo({ center: [longitude, latitude], zoom: 13, speed: 1.4 });
      if (userMarkerRef.current) userMarkerRef.current.remove();
      const el = document.createElement("div");
      el.style.cssText = "width:14px;height:14px;background:#3B82F6;border:2.5px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(59,130,246,0.2)";
      userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(map);
    }, () => {}, { enableHighAccuracy: true, timeout: 8000 });
  }

  function zoomIn() { mapInstance.current?.zoomIn({ duration: 300 }); }
  function zoomOut() { mapInstance.current?.zoomOut({ duration: 300 }); }

  /* ── Subscriptions ────────────────────────────────── */
  useEffect(() => {
    loadAlerts();
    const ch = supabase.channel("alerts-rt").on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => loadAlerts()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadAlerts]);

  useEffect(() => {
    const t = setInterval(() => { loadAlerts(); forceUpdate((v) => v + 1); }, 60000);
    return () => clearInterval(t);
  }, [loadAlerts]);

  /* ── Cached GeoJSON so we don't re-fetch on every style change ── */
  const geoCache = useRef<{ admin3?: any; israel?: any }>({});

  async function addOverlaySources(map: maplibregl.Map) {
    try {
      if (!geoCache.current.admin3) {
        const res = await fetch("/data/lbn_admin3.geojson");
        if (res.ok) geoCache.current.admin3 = await res.json();
      }
      if (geoCache.current.admin3 && !map.getSource("admin3")) {
        map.addSource("admin3", { type: "geojson", data: geoCache.current.admin3 });
      }
    } catch {}
    try {
      if (!geoCache.current.israel) {
        const res = await fetch("/data/israel_areas.geojson");
        if (res.ok) geoCache.current.israel = await res.json();
      }
      if (geoCache.current.israel && !map.getSource("israel-areas")) {
        map.addSource("israel-areas", { type: "geojson", data: geoCache.current.israel });
      }
    } catch {}
  }

  function getStyleUrl(t: string) {
    const key = t === "light" ? "streets-v2" : "streets-v2-dark";
    return `https://api.maptiler.com/maps/${key}/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;
  }

  /* ── Map init (runs once) ─────────────────────────── */
  useEffect(() => {
    if (!mapRef.current) return;
    const rtl = maplibregl.getRTLTextPluginStatus();
    if (rtl === "unavailable") maplibregl.setRTLTextPlugin("https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js", true);

    /* Read the actual theme from the DOM (set by the anti-FOUC script in layout.tsx) */
    const savedTheme = document.documentElement.getAttribute("data-theme") || "dark";

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: getStyleUrl(savedTheme),
      center: [35.22, 33.27],
      zoom: 11,
      minZoom: 6,
      maxZoom: 15,
    });
    mapInstance.current = map;

    map.on("load", async () => {
      await addOverlaySources(map);
      const readyTimeout = setTimeout(() => setMapReady(true), 2000);
      map.once("idle", () => { clearTimeout(readyTimeout); setMapReady(true); });
    });
    map.on("error", (e) => console.error("Map error:", e));
    return () => { map.remove(); setMapReady(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Switch map style when theme changes (not on first render) ── */
  const initialThemeRef = useRef(true);
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    /* Skip the very first run (map was just created with the correct style) */
    if (initialThemeRef.current) {
      initialThemeRef.current = false;
      return;
    }
    setMapReady(false);
    // Clean up existing alert layers/markers before style swap
    cleanupHandlersRef.current.forEach((c) => c()); cleanupHandlersRef.current = [];
    strikeMarkersRef.current.forEach((m) => m.remove()); strikeMarkersRef.current = [];
    activeLayerIdsRef.current = [];
    activeSourceIdsRef.current = [];

    map.setStyle(getStyleUrl(theme));
    map.once("style.load", async () => {
      await addOverlaySources(map);
      setMapReady(true);
    });
  }, [theme]);

  /* ── Render alerts on map ─────────────────────────── */
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
        map.addLayer({ id: fillId, type: "fill", source: srcId, paint: { "fill-color": "#E53935", "fill-opacity": 0.25 } });
        map.addLayer({ id: lineId, type: "line", source: srcId, paint: { "line-color": "#E53935", "line-width": 1.5, "line-dasharray": [4, 2] } });
        activeLayerIdsRef.current.push(fillId, lineId);
        const el = document.createElement("div"); el.className = "siren-marker";
        const isDrone = alert.type === "siren_drone";
        el.innerHTML = isDrone
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="12,3 4,14 8,14 8,12 12,8 16,12 16,14 20,14"/><rect x="11" y="14" width="2" height="7" rx="1"/><polygon points="7,16 12,21 17,16"/></svg>'
          : '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2c-.5 0-1 .2-1.3.6L8 7v3L5 13v2h4l-1 5.5c-.1.8.6 1.5 1.4 1.5h5.2c.8 0 1.5-.7 1.4-1.5L15 15h4v-2l-3-3V7l-2.7-4.4C13 2.2 12.5 2 12 2z"/></svg>';
        el.addEventListener("click", (e) => { e.stopPropagation(); showAlertPopup(alert, [alert.lng, alert.lat]); });
        strikeMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([alert.lng, alert.lat]).addTo(map));
        const ch = (e: maplibregl.MapLayerMouseEvent) => showAlertPopup(alert, e.lngLat);
        const me = () => { map.getCanvas().style.cursor = "pointer"; };
        const ml = () => { map.getCanvas().style.cursor = ""; };
        map.on("click", fillId, ch); map.on("mouseenter", fillId, me); map.on("mouseleave", fillId, ml);
        cleanupHandlersRef.current.push(() => { map.off("click", fillId, ch); map.off("mouseenter", fillId, me); map.off("mouseleave", fillId, ml); });
        return;
      }

      if (isAreaHighlight && userSettings.highlightAreas) {
        const fId = `area-${alert.id}`, lId = `area-line-${alert.id}`;
        const color = alert.type === "threat" ? "#F59E0B" : alert.type === "enemy_position" ? "#A855F7" : "#22C55E";
        map.addLayer({ id: fId, type: "fill", source: "admin3", paint: { "fill-color": color, "fill-opacity": 0.35 }, filter: ["==", ["get", "adm3_name1"], alert.area] });
        map.addLayer({ id: lId, type: "line", source: "admin3", paint: { "line-color": color, "line-width": 2 }, filter: ["==", ["get", "adm3_name1"], alert.area] });
        activeLayerIdsRef.current.push(fId, lId);
        const ch = (e: maplibregl.MapLayerMouseEvent) => showAlertPopup(alert, e.lngLat);
        const me = () => { map.getCanvas().style.cursor = "pointer"; };
        const ml = () => { map.getCanvas().style.cursor = ""; };
        map.on("click", fId, ch); map.on("mouseenter", fId, me); map.on("mouseleave", fId, ml);
        cleanupHandlersRef.current.push(() => { map.off("click", fId, ch); map.off("mouseenter", fId, me); map.off("mouseleave", fId, ml); });
        return;
      }

      /* Generic circle overlay */
      const srcId = `src-${alert.id}`, fId = `fill-${alert.id}`, lId = `line-${alert.id}`;
      const circle = createCircleGeoJSON(alert.lng, alert.lat, alert.radius || 800);
      map.addSource(srcId, { type: "geojson", data: circle as any }); activeSourceIdsRef.current.push(srcId);
      map.addLayer({ id: fId, type: "fill", source: srcId, paint: { "fill-color": alert.color || "#5BA4E6", "fill-opacity": 0.2 } });
      map.addLayer({ id: lId, type: "line", source: srcId, paint: { "line-color": alert.color || "#5BA4E6", "line-width": 1.5 } });
      activeLayerIdsRef.current.push(fId, lId);
      const ch = (e: maplibregl.MapLayerMouseEvent) => showAlertPopup(alert, e.lngLat);
      const me = () => { map.getCanvas().style.cursor = "pointer"; };
      const ml = () => { map.getCanvas().style.cursor = ""; };
      map.on("click", fId, ch); map.on("mouseenter", fId, me); map.on("mouseleave", fId, ml);
      cleanupHandlersRef.current.push(() => { map.off("click", fId, ch); map.off("mouseenter", fId, me); map.off("mouseleave", fId, ml); });
    });
  }, [visibleAlerts, mapReady, userSettings.highlightAreas, theme]);

  const activeFilterLabel = FILTERS.find((f) => f.value === activeFilter)?.label || "الكل";

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <main className="h-screen flex flex-col" style={{ background: "var(--bg-deep)", color: "var(--text)" }} dir="rtl">

      {/* ─── HEADER ─────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-4 relative z-50" style={{ background: "var(--bg-surface)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)" }}>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image src="/new_logo.jpg" alt="البيان الإخباري" width={36} height={36} className="rounded-lg" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold leading-tight">البيان الإخباري</h1>
            <p className="text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>من قلب الحدث</p>
          </div>
        </div>

        {/* Center status — desktop only */}
        <div className="hidden lg:flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>مباشر</span>
          </span>
          <span style={{ color: "var(--border)" }}>|</span>
          <span>تغطية لبنان</span>
          {sirenCount > 0 && (
            <>
              <span style={{ color: "var(--border)" }}>|</span>
              <span className="font-bold" style={{ color: "var(--accent)" }}>صافرات في {sirenCount} مناطق</span>
            </>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button onClick={toggleTheme} className="map-btn !w-8 !h-8" title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link href="/settings" className="map-btn !w-8 !h-8"><Settings size={15} /></Link>
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer"
              className="h-8 px-3 flex items-center rounded-lg text-xs font-bold transition"
              style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>
              تلغرام
            </a>
            <Link href="/donate"
              className="h-8 px-3 flex items-center rounded-lg text-xs font-bold transition"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              ادعمنا
            </Link>
            <Link href="/report"
              className="h-8 px-3 flex items-center rounded-lg text-xs font-bold text-white transition"
              style={{ background: "var(--accent)" }}>
              بلّغ
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden map-btn !w-8 !h-8" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-14 left-0 right-0 p-3 flex flex-col gap-1.5 md:hidden z-50" style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border)" }}>
            <Link href="/report" onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-2.5 text-center text-sm font-bold text-white"
              style={{ background: "var(--accent)" }}>
              بلّغ
            </Link>
            <Link href="/donate" onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-2.5 text-center text-sm font-bold transition"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              ادعمنا
            </Link>
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer"
              className="rounded-lg px-4 py-2.5 text-center text-sm font-bold transition"
              style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>
              تلغرام
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="rounded-lg px-4 py-2.5 text-center text-sm font-bold transition"
              style={{ background: "var(--green-soft)", color: "var(--green)" }}>
              واتساب
            </a>
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-2.5 text-center text-sm font-bold transition"
              style={{ background: "var(--bg-card)" }}>
              الإعدادات
            </Link>
          </div>
        )}
      </header>

      {/* ─── MAP AREA ───────────────────────────────── */}
      <div className="relative flex-1 w-full">

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg-deep)" }}>
            <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid var(--border)", borderTopColor: "var(--accent)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>جاري التحميل...</p>
          </div>
        )}

        {/* Error bar */}
        {error && (
          <div className="absolute top-0 left-0 right-0 z-30 px-4 py-2 text-center text-xs font-bold text-white" style={{ background: "var(--accent)" }}>
            {error} <button onClick={loadAlerts} className="mr-2 underline">إعادة المحاولة</button>
          </div>
        )}

        {/* Urgent bar */}
        {userSettings.urgentBar && urgentAlerts.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-30 h-10 flex items-center justify-center text-white" style={{ background: "var(--accent)" }}>
            <span className="relative flex h-2 w-2 ml-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span className="font-black text-sm ml-2">عاجل</span>
            <span className="text-sm font-bold">{cleanLabel(urgentAlerts[0].type_label)} — {urgentAlerts[0].area}</span>
          </div>
        )}

        {/* ── Floating Filter Panel ─────────────────── */}
        <div className={`absolute z-20 right-3 ${userSettings.urgentBar && urgentAlerts.length > 0 ? "top-14" : "top-3"}`}>
          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className="glass-panel flex items-center gap-2 px-3 py-2 text-xs font-bold cursor-pointer"
          >
            <Filter size={14} />
            <span>تصفية</span>
            {activeFilter !== "all" && (
              <span className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{ background: "var(--accent)" }}>
                {activeFilterLabel}
              </span>
            )}
          </button>

          {filterPanelOpen && (
            <div className="glass-panel mt-2 p-3 w-52 space-y-1">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setActiveFilter(f.value); setFilterPanelOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition"
                  style={{
                    background: activeFilter === f.value ? "var(--accent)" : "transparent",
                    color: activeFilter === f.value ? "white" : "var(--text-secondary)",
                  }}
                >
                  {f.color && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: f.color }} />}
                  {f.value === "all" && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "var(--text-muted)" }} />}
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Map container ─────────────────────────── */}
        <div ref={mapRef} className="h-full w-full" />

        {/* ── Right controls (zoom, locate) ─────────── */}
        <div className={`absolute left-3 z-20 flex flex-col gap-2 ${userSettings.urgentBar && urgentAlerts.length > 0 ? "top-14" : "top-3"}`}>
          <button onClick={zoomIn} className="map-btn" title="تكبير"><Plus size={16} /></button>
          <button onClick={zoomOut} className="map-btn" title="تصغير"><Minus size={16} /></button>
          <button onClick={locateUser} className="map-btn" title="موقعي" style={{ color: "var(--blue)" }}><LocateFixed size={16} /></button>
        </div>

        {/* ── Legend — desktop only ──────────────────── */}
        <div className="glass-panel absolute bottom-40 right-3 z-20 p-3 hidden xl:block">
          <h3 className="font-bold text-[10px] mb-2 tracking-wider" style={{ color: "var(--text-muted)" }}>مفتاح الخريطة</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /><span>غارة / قصف</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#F59E0B]" /><span>تهديد</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#A855F7]" /><span>تمركز العدو</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#22C55E]" /><span>الجيش اللبناني</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#5BA4E6]" /><span>مسيّرات</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded border border-dashed border-[#E53935] bg-[#E53935]/25" /><span>صافرات إنذار</span></div>
          </div>
        </div>

        {/* ── Events panel — bottom left ─────────────── */}
        <div className="absolute left-3 bottom-12 z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="glass-panel flex items-center gap-2 px-3 py-2 text-xs font-bold cursor-pointer"
            style={{ borderTopLeftRadius: sidebarOpen ? 0 : 12, borderTopRightRadius: sidebarOpen ? 0 : 12, borderTop: sidebarOpen ? "none" : undefined, width: sidebarOpen ? "280px" : "auto" }}
          >
            <span className="px-1.5 py-0.5 rounded text-[10px] text-white min-w-[20px] text-center" style={{ background: "var(--accent)" }}>{visibleAlerts.length}</span>
            <span className="flex-1 text-right">{sidebarOpen ? "الأحداث المباشرة" : "الأحداث"}</span>
            {sidebarOpen ? <ChevronDown size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronUp size={14} style={{ color: "var(--text-muted)" }} />}
          </button>

          {sidebarOpen && (
            <div
              className="w-[280px] max-h-[50vh] overflow-y-auto rounded-t-xl absolute bottom-full left-0"
              style={{ background: "var(--bg-surface)", backdropFilter: "blur(16px)", border: "1px solid var(--border)", borderBottom: "none" }}
            >
              <div className="p-2 space-y-1.5">
                {visibleAlerts.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>لا توجد أحداث حالياً</p>
                ) : visibleAlerts.map((alert) => {
                  const color = TYPE_COLORS[alert.type] || "#5BA4E6";
                  return (
                    <button
                      key={alert.id}
                      onClick={() => openAlert(alert)}
                      className="w-full text-right rounded-lg p-3 transition relative overflow-hidden"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-[3px] rounded-r-lg" style={{ backgroundColor: color }} />
                      <div className="pr-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold" style={{ color }}>{cleanLabel(alert.type_label)}</span>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{getTimeAgo(alert.created_at)}</span>
                        </div>
                        <div className="text-sm mt-1 font-bold">{alert.area}</div>
                        {alert.description && <div className="text-[11px] mt-1 line-clamp-1" style={{ color: "var(--text-secondary)" }}>{alert.description}</div>}
                        <div className="text-[10px] mt-1.5" style={{ color: "#F59E0B" }}>ينتهي بعد: {getRemainingTime(alert.expires_at)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom bar ────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center h-8 text-[10px]"
          style={{ background: "var(--bg-surface)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
          <span>البيان الإخباري — الخريطة المباشرة</span>
          <span className="mx-2">|</span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            مباشر
          </span>
        </div>
      </div>
    </main>
  );
}