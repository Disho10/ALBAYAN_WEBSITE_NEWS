"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Settings, Menu, X, LocateFixed, ChevronUp, ChevronDown,
  Sun, Moon, Layers, Filter, Plus, Minus, Search, Share2, Clock,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import type { AlertItem, Area } from "@/app/lib/types";
import { TELEGRAM_CHANNEL_URL, WHATSAPP_URL, SITE_URL } from "@/app/lib/types";
import { useApp } from "@/app/components/ThemeProvider";

/* ─── Types ──────────────────────────────────────────── */
type UserSettings = {
  soundEnabled: boolean; urgentBar: boolean; highlightAreas: boolean;
  selectedArea: string; enabledAlertTypes: string[]; soundType: string;
};
const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true, urgentBar: true, highlightAreas: true,
  selectedArea: "صور", enabledAlertTypes: [], soundType: "beep",
};
function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try { const s = localStorage.getItem("albayan-settings"); if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) }; } catch {}
  return DEFAULT_SETTINGS;
}

/* ─── Geometry ───────────────────────────────────────── */
function createCircleGeoJSON(lng: number, lat: number, r: number) {
  const pts = 64, coords = [], R = 6371000;
  const latR = (lat * Math.PI) / 180, lngR = (lng * Math.PI) / 180;
  for (let i = 0; i <= pts; i++) {
    const a = (i * 2 * Math.PI) / pts;
    const nLat = Math.asin(Math.sin(latR) * Math.cos(r / R) + Math.cos(latR) * Math.sin(r / R) * Math.cos(a));
    const nLng = lngR + Math.atan2(Math.sin(a) * Math.sin(r / R) * Math.cos(latR), Math.cos(r / R) - Math.sin(latR) * Math.sin(nLat));
    coords.push([(nLng * 180) / Math.PI, (nLat * 180) / Math.PI]);
  }
  return { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: {} };
}

/* ─── Helpers ────────────────────────────────────────── */
function getRemainingTime(expiresAt?: string | null, isAr = true) {
  if (!expiresAt) return isAr ? "دائم" : "Permanent";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return isAr ? "انتهى" : "Expired";
  const m = Math.floor(diff / 60000);
  if (m < 1) return isAr ? "أقل من دقيقة" : "<1m";
  if (m < 60) return isAr ? `${m} د` : `${m}m`;
  const h = Math.floor(m / 60), rm = m % 60;
  return rm === 0 ? (isAr ? `${h} س` : `${h}h`) : (isAr ? `${h} س ${rm} د` : `${h}h ${rm}m`);
}

function getTimeAgo(createdAt?: string, isAr = true) {
  if (!createdAt) return "";
  const diff = Date.now() - new Date(createdAt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return isAr ? "الآن" : "now";
  if (m < 60) return isAr ? `منذ ${m} د` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return isAr ? `منذ ${h} س` : `${h}h ago`;
  return isAr ? `منذ ${Math.floor(h / 24)} ي` : `${Math.floor(h / 24)}d ago`;
}

function matchesFilter(a: AlertItem, f: string) {
  if (f === "all") return true;
  if (f === "strikes") return a.type === "strike" || a.type === "artillery";
  if (f === "siren") return a.type === "siren" || a.type === "siren_missile" || a.type === "siren_drone";
  return a.type === f;
}

function matchesTimeFilter(a: AlertItem, tf: string) {
  if (tf === "all" || !a.created_at) return true;
  const hours = tf === "1h" ? 1 : tf === "6h" ? 6 : 24;
  return Date.now() - new Date(a.created_at).getTime() < hours * 3600000;
}

function playAlertSound(type = "beep") {
  try {
    const ctx = new AudioContext();
    if (type === "alarm") {
      for (let i = 0; i < 3; i++) setTimeout(() => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.frequency.value = 800 + i * 100; o.type = "sawtooth"; g.gain.value = 0.08;
        o.start(ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); o.stop(ctx.currentTime + 0.3);
      }, i * 200);
    } else if (type === "chime") {
      [523, 659, 784].forEach((f, i) => setTimeout(() => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.frequency.value = f; o.type = "sine"; g.gain.value = 0.1;
        o.start(ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); o.stop(ctx.currentTime + 0.4);
      }, i * 150));
    } else {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; o.type = "sine"; g.gain.value = 0.12;
      o.start(); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); o.stop(ctx.currentTime + 0.5);
      setTimeout(() => { const o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.connect(g2); g2.connect(ctx.destination); o2.frequency.value = 1100; o2.type = "sine"; g2.gain.value = 0.12; o2.start(); g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8); o2.stop(ctx.currentTime + 0.8); }, 180);
    }
  } catch {}
}

const TYPE_COLORS: Record<string, string> = {
  strike: "#EF4444", artillery: "#DC2626", drone: "#5BA4E6", threat: "#F59E0B",
  enemy_position: "#A855F7", army_position: "#22C55E", traffic: "#38BDF8",
  crowd: "#DC2626", fire: "#F97316", injuries: "#E11D48",
  siren: "#E53935", siren_missile: "#E53935", siren_drone: "#E53935",
};

function cleanLabel(label: string) { return label.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, "").trim(); }
function hashTag(label: string) { return cleanLabel(label).replace(/\s+/g, "_"); }

const LEBANESE_CITIES = new Set([
  "بيروت", "طرابلس", "صيدا", "صور", "زحلة", "بعلبك",
  "بنت جبيل", "مرجعيون", "زغرتا", "جبيل", "بعبدا", "عاليه",
  "جزين", "حلبا", "بشري", "الدامور", "القاع", "عنجر",
  "بيت الدين", "جونيه", "بترون", "اهدن", "النبطية",
]);
function placeWord(area: string) { return LEBANESE_CITIES.has(area) ? "مدينة" : "بلدة"; }

const TYPE_LABELS_EN: Record<string, string> = {
  strike: "Strike", artillery: "Artillery", drone: "Drone Activity",
  threat: "Threat", enemy_position: "Enemy Position", army_position: "Army Deployment",
  traffic: "Accident", crowd: "Clashes", fire: "Fire", injuries: "Injuries",
  siren: "Siren", siren_missile: "Missile Siren", siren_drone: "Drone Siren",
};

function popupColor(theme: string, key: "bg" | "border" | "text" | "muted" | "sub") {
  const dark = { bg: "#152238", border: "#1E3350", text: "#F1F5F9", muted: "#5A6B80", sub: "#0D1B2A" };
  const light = { bg: "#FFFFFF", border: "#DDE3ED", text: "#0F172A", muted: "#64748B", sub: "#F6F8FB" };
  return (theme === "light" ? light : dark)[key];
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function createAlertPopupHTML(alert: AlertItem, theme: string, lang: string) {
  const isAr = lang === "ar";
  const remaining = getRemainingTime(alert.expires_at, isAr);
  const color = TYPE_COLORS[alert.type] || "#5BA4E6";
  const label = isAr ? cleanLabel(alert.type_label) : (TYPE_LABELS_EN[alert.type] || cleanLabel(alert.type_label));
  const bg = popupColor(theme, "bg"), border = popupColor(theme, "border"), text = popupColor(theme, "text"), muted = popupColor(theme, "muted"), sub = popupColor(theme, "sub");
  const imgHtml = alert.image_url ? `<img src="${escapeHtml(alert.image_url)}" style="width:100%;border-radius:10px;margin-top:10px;max-height:130px;object-fit:cover;" />` : "";
  const rawUrl = `${SITE_URL}/?alert=${alert.id}`;
  const headline = `#${hashTag(alert.type_label)} في ${placeWord(alert.area)} #${alert.area}`;
  const shareTextWA = encodeURIComponent(`${headline}\n\nالتفاصيل الكاملة:\n${rawUrl}`);
  const shareTextTG = encodeURIComponent(`${headline}\n\nالتفاصيل الكاملة:\n${rawUrl}`);
  const remainLabel = isAr ? "المدة المتبقية" : "Remaining";
  const noDesc = isAr ? "لا توجد تفاصيل إضافية." : "No additional details.";
  const copiedLabel = isAr ? "✓ تم" : "✓ Done";
  const dir = isAr ? "rtl" : "ltr";
  const txtAlign = isAr ? "right" : "left";
  const btnStyle = `display:flex;align-items:center;justify-content:center;gap:5px;background:${sub};border:1px solid ${border};border-radius:10px;padding:9px 0;font-size:11px;font-weight:700;color:${muted};cursor:pointer;text-decoration:none;transition:opacity 0.15s;`;

  return `<div dir="${dir}" style="width:285px;background:${bg};color:${text};border:1px solid ${border};border-radius:16px;overflow:hidden;font-family:inherit;box-shadow:0 16px 40px rgba(0,0,0,${theme === "light" ? "0.12" : "0.5"});">
    <div style="height:3px;background:linear-gradient(${isAr ? "90deg" : "270deg"},${color},${color}88);"></div>
    <div style="padding:16px 18px 14px;text-align:${txtAlign};">
      <div style="margin-bottom:12px;">
        <span style="background:${color}18;color:${color};border:1px solid ${color}30;padding:4px 12px;border-radius:8px;font-size:12px;font-weight:700;">${escapeHtml(label)}</span>
      </div>
      <h3 style="margin:0 0 6px;font-size:18px;font-weight:800;line-height:1.4;">${escapeHtml(alert.area)}</h3>
      <p style="margin:0;color:${muted};font-size:13px;line-height:1.9;">${alert.description ? escapeHtml(alert.description) : noDesc}</p>
      ${imgHtml}
      <div style="margin-top:14px;background:${sub};border:1px solid ${border};border-radius:10px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:${muted};font-size:11px;font-weight:600;">${remainLabel}</span>
        <span style="color:#F59E0B;font-weight:700;font-size:13px;">${remaining}</span>
      </div>
      <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
        <a href="https://wa.me/?text=${shareTextWA}" target="_blank" rel="noopener" style="${btnStyle}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="${muted}"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.106 1.516 5.834L.05 23.5l5.766-1.512A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.97 0-3.834-.548-5.44-1.497l-.39-.232-3.422.897.913-3.337-.254-.403A9.7 9.7 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
        </a>
        <a href="https://t.me/share/url?url=&text=${shareTextTG}" target="_blank" rel="noopener" style="${btnStyle}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="${muted}"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224l-1.84 9.203c-.14.634-.505.788-.963.518l-2.77-2.04-1.337 1.29c-.148.148-.273.273-.56.273l.198-2.82 5.136-4.641c.224-.198-.048-.308-.347-.11L8.55 13.11l-2.72-.847c-.59-.187-.603-.59.124-.873l10.64-4.104c.492-.177.923.12.312.937z"/></svg>
        </a>
        <button onclick="navigator.clipboard.writeText('${rawUrl}');this.textContent='${copiedLabel}';setTimeout(()=>this.innerHTML='<svg width=\\'13\\' height=\\'13\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><rect x=\\'9\\' y=\\'9\\' width=\\'13\\' height=\\'13\\' rx=\\'2\\'/><path d=\\'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1\\'/></svg>',1500)" style="${btnStyle}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
      <div style="text-align:center;margin-top:5px;font-size:9px;color:${muted};opacity:0.6;display:flex;justify-content:space-around;">
        <span>WhatsApp</span><span>Telegram</span><span>${isAr ? "نسخ" : "Copy"}</span>
      </div>
    </div></div>`;
}

/* ─── Filters ────────────────────────────────────────── */
const FILTERS = [
  { value: "all", lk: "all" as const },
  { value: "strikes", lk: "strikes" as const, color: "#EF4444" },
  { value: "drone", lk: "drones" as const, color: "#5BA4E6" },
  { value: "threat", lk: "threats" as const, color: "#F59E0B" },
  { value: "enemy_position", lk: "enemyPos" as const, color: "#A855F7" },
  { value: "army_position", lk: "army" as const, color: "#22C55E" },
  { value: "siren", lk: "sirens" as const, color: "#E53935" },
  { value: "traffic", lk: "accidents" as const, color: "#38BDF8" },
  { value: "crowd", lk: "clashes" as const, color: "#DC2626" },
];

const TIME_FILTERS = [
  { value: "all", lk: "all" as const },
  { value: "1h", lk: "lastHour" as const },
  { value: "6h", lk: "last6Hours" as const },
  { value: "24h", lk: "last24Hours" as const },
];

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function Home() {
  const { theme, toggleTheme, lang, toggleLang, t } = useApp();
  const isAr = lang === "ar";

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
  const geoCache = useRef<{ admin3?: any; israel?: any }>({});

  /* State */
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connStatus, setConnStatus] = useState<"ok" | "reconnecting" | "error">("ok");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [mapStyle, setMapStyle] = useState("default");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [, forceUpdate] = useState(0);

  /* Search */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [areasData, setAreasData] = useState<Area[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !areasData.length) return [];
    const q = searchQuery.toLowerCase();
    return areasData.filter((a) =>
      a.name.includes(searchQuery) || a.nameEn.toLowerCase().includes(q) || a.district.includes(searchQuery)
    ).slice(0, 8);
  }, [searchQuery, areasData]);

  /* Derived */
  const visibleAlerts = useMemo(() =>
    alerts.filter((a) => matchesFilter(a, activeFilter)).filter((a) => matchesTimeFilter(a, timeFilter)),
    [alerts, activeFilter, timeFilter]
  );
  const urgentAlerts = useMemo(() => alerts.filter((a) => a.is_urgent), [alerts]);
  const sirenCount = useMemo(() => alerts.filter((a) => a.type?.startsWith("siren")).length, [alerts]);

  useEffect(() => { setUserSettings(loadSettings()); }, []);
  useEffect(() => {
    fetch("/data/areas.json").then((r) => r.json()).then(setAreasData).catch(() => {});
  }, []);

  /* ── Data loading ──────────────────────────────────── */
  const loadAlerts = useCallback(async () => {
    try {
      setConnStatus("ok");
      const { data, error: e } = await supabase.from("alerts").select("*").eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).order("created_at", { ascending: false });
      if (e) throw e;
      const newAlerts = data || [];
      if (userSettings.soundEnabled) {
        const prev = prevAlertIdsRef.current;
        for (const a of newAlerts) { if (a.is_urgent && !prev.has(a.id)) { playAlertSound(userSettings.soundType); break; } }
        prevAlertIdsRef.current = new Set(newAlerts.map((a) => a.id));
      }
      setAlerts(newAlerts);
      setError(null);
    } catch {
      setConnStatus("error");
      setError(t("loadError"));
    } finally { setLoading(false); }
  }, [userSettings.soundEnabled, userSettings.soundType, t]);

  /* ── Popups ────────────────────────────────────────── */
  function showAlertPopup(alert: AlertItem, lngLat: maplibregl.LngLatLike) {
    const map = mapInstance.current; if (!map) return;
    if (activePopupRef.current) activePopupRef.current.remove();
    activePopupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 16 })
      .setLngLat(lngLat).setHTML(createAlertPopupHTML(alert, theme, lang)).addTo(map);
  }

  function openAlert(alert: AlertItem) {
    const map = mapInstance.current; if (!map) return;
    map.flyTo({ center: [alert.lng, alert.lat], zoom: 13.5, speed: 1.2 });
    showAlertPopup(alert, [alert.lng, alert.lat]);
  }

  function flyToArea(area: Area) {
    const map = mapInstance.current; if (!map) return;
    map.flyTo({ center: [area.lng, area.lat], zoom: 13, speed: 1.4 });
    setSearchQuery(""); setSearchOpen(false);
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

  /* ── Keyboard shortcuts ────────────────────────────── */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") { e.preventDefault(); setFilterPanelOpen((v) => !v); }
      if (e.key === "s" || e.key === "S") { e.preventDefault(); setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }
      if (e.key === "l" || e.key === "L") { e.preventDefault(); locateUser(); }
      if (e.key === "Escape") { setFilterPanelOpen(false); setLayerPanelOpen(false); setSearchOpen(false); setSearchQuery(""); if (activePopupRef.current) activePopupRef.current.remove(); }
      if (e.key === "=" || e.key === "+") { e.preventDefault(); zoomIn(); }
      if (e.key === "-") { e.preventDefault(); zoomOut(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* ── Subscriptions ─────────────────────────────────── */
  useEffect(() => {
    loadAlerts();
    const ch = supabase.channel("alerts-rt").on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => loadAlerts()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadAlerts]);

  useEffect(() => {
    const iv = setInterval(() => { loadAlerts(); forceUpdate((v) => v + 1); }, 60000);
    return () => clearInterval(iv);
  }, [loadAlerts]);

  /* ── Map helpers ───────────────────────────────────── */
  async function addOverlaySources(map: maplibregl.Map) {
    try {
      if (!geoCache.current.admin3) { const r = await fetch("/data/lbn_admin3.geojson"); if (r.ok) geoCache.current.admin3 = await r.json(); }
      if (geoCache.current.admin3 && !map.getSource("admin3")) map.addSource("admin3", { type: "geojson", data: geoCache.current.admin3 });
    } catch {}
    try {
      if (!geoCache.current.israel) { const r = await fetch("/data/israel_areas.geojson"); if (r.ok) geoCache.current.israel = await r.json(); }
      if (geoCache.current.israel && !map.getSource("israel-areas")) map.addSource("israel-areas", { type: "geojson", data: geoCache.current.israel });
    } catch {}
  }

  function getStyleUrl(t: string, style: string) {
    const key = style === "satellite" ? "satellite" : t === "light" ? "streets-v2" : "streets-v2-dark";
    return `https://api.maptiler.com/maps/${key}/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;
  }

  function swapStyle(newTheme?: string, newStyle?: string) {
    const map = mapInstance.current; if (!map) return;
    setMapReady(false);
    cleanupHandlersRef.current.forEach((c) => c()); cleanupHandlersRef.current = [];
    strikeMarkersRef.current.forEach((m) => m.remove()); strikeMarkersRef.current = [];
    activeLayerIdsRef.current = []; activeSourceIdsRef.current = [];
    map.setStyle(getStyleUrl(newTheme || theme, newStyle || mapStyle));
    map.once("style.load", async () => { await addOverlaySources(map); setMapReady(true); });
  }

  /* ── Map init ──────────────────────────────────────── */
  useEffect(() => {
    if (!mapRef.current) return;
    const rtl = maplibregl.getRTLTextPluginStatus();
    if (rtl === "unavailable") maplibregl.setRTLTextPlugin("https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js", true);
    const savedTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: getStyleUrl(savedTheme, "default"),
      center: [35.22, 33.27], zoom: 11, minZoom: 6, maxZoom: 15,
    });
    mapInstance.current = map;
    map.on("load", async () => {
      await addOverlaySources(map);
      const to = setTimeout(() => setMapReady(true), 2000);
      map.once("idle", () => { clearTimeout(to); setMapReady(true); });
    });
    map.on("error", (e) => console.error("Map error:", e));

    /* Deep link: ?alert=123 */
    const params = new URLSearchParams(window.location.search);
    const alertId = params.get("alert");
    if (alertId) {
      const check = setInterval(() => {
        const found = alerts.find((a) => a.id === Number(alertId));
        if (found) { openAlert(found); clearInterval(check); }
      }, 500);
      setTimeout(() => clearInterval(check), 10000);
    }

    return () => { map.remove(); setMapReady(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Theme / style changes ─────────────────────────── */
  const initRef = useRef(true);
  useEffect(() => { if (initRef.current) { initRef.current = false; return; } swapStyle(theme, mapStyle); }, [theme]);

  function changeMapStyle(style: string) {
    setMapStyle(style);
    swapStyle(theme, style);
    setLayerPanelOpen(false);
  }

  /* ── Heatmap layer ─────────────────────────────────── */
  useEffect(() => {
    const map = mapInstance.current; if (!map || !mapReady) return;
    if (map.getLayer("heatmap-layer")) map.removeLayer("heatmap-layer");
    if (map.getSource("heatmap-src")) map.removeSource("heatmap-src");
    if (!showHeatmap || visibleAlerts.length === 0) return;
    const fc = { type: "FeatureCollection", features: visibleAlerts.map((a) => ({ type: "Feature", geometry: { type: "Point", coordinates: [a.lng, a.lat] }, properties: { urgency: a.is_urgent ? 2 : 1 } })) };
    map.addSource("heatmap-src", { type: "geojson", data: fc as any });
    map.addLayer({ id: "heatmap-layer", type: "heatmap", source: "heatmap-src", paint: { "heatmap-weight": ["get", "urgency"], "heatmap-intensity": 1.5, "heatmap-radius": 30, "heatmap-opacity": 0.6, "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.2, "#2563EB", 0.4, "#22C55E", 0.6, "#F59E0B", 0.8, "#EF4444", 1, "#DC2626"] } });
  }, [showHeatmap, visibleAlerts, mapReady]);

  /* ── Render alerts on map ──────────────────────────── */
  useEffect(() => {
    const map = mapInstance.current; if (!map || !mapReady) return;
    cleanupHandlersRef.current.forEach((c) => c()); cleanupHandlersRef.current = [];
    strikeMarkersRef.current.forEach((m) => m.remove()); strikeMarkersRef.current = [];
    activeLayerIdsRef.current.forEach((id) => { if (map.getLayer(id)) map.removeLayer(id); }); activeLayerIdsRef.current = [];
    activeSourceIdsRef.current.forEach((id) => { if (map.getSource(id)) map.removeSource(id); }); activeSourceIdsRef.current = [];

    /* Clustered source for strikes */
    const strikeAlerts = visibleAlerts.filter((a) => a.type === "strike" || a.type === "artillery");
    if (strikeAlerts.length > 0) {
      const fc = { type: "FeatureCollection", features: strikeAlerts.map((a) => ({ type: "Feature", geometry: { type: "Point", coordinates: [a.lng, a.lat] }, properties: { id: a.id } })) };
      if (!map.getSource("strikes-cluster")) {
        map.addSource("strikes-cluster", { type: "geojson", data: fc as any, cluster: true, clusterMaxZoom: 14, clusterRadius: 50 });
        activeSourceIdsRef.current.push("strikes-cluster");
      } else {
        (map.getSource("strikes-cluster") as maplibregl.GeoJSONSource).setData(fc as any);
      }
      if (!map.getLayer("strike-clusters")) {
        map.addLayer({ id: "strike-clusters", type: "circle", source: "strikes-cluster", filter: ["has", "point_count"],
          paint: { "circle-color": "#EF4444", "circle-radius": ["step", ["get", "point_count"], 16, 5, 22, 10, 28], "circle-opacity": 0.85, "circle-stroke-width": 2, "circle-stroke-color": "rgba(255,255,255,0.8)" } });
        map.addLayer({ id: "strike-cluster-count", type: "symbol", source: "strikes-cluster", filter: ["has", "point_count"],
          layout: { "text-field": "{point_count_abbreviated}", "text-size": 11 }, paint: { "text-color": "#ffffff" } });
        map.addLayer({ id: "strike-unclustered", type: "circle", source: "strikes-cluster", filter: ["!", ["has", "point_count"]],
          paint: { "circle-color": "#EF4444", "circle-radius": 7, "circle-opacity": 0.9, "circle-stroke-width": 2, "circle-stroke-color": "rgba(255,255,255,0.85)" } });
        activeLayerIdsRef.current.push("strike-clusters", "strike-cluster-count", "strike-unclustered");

        map.on("click", "strike-clusters", (e) => {
          const f = e.features?.[0]; if (!f) return;
          (map.getSource("strikes-cluster") as maplibregl.GeoJSONSource).getClusterExpansionZoom(f.properties.cluster_id).then((zoom) => {
            const coords = (f.geometry as any).coordinates;
            map.easeTo({ center: coords, zoom });
          });
        });
        map.on("click", "strike-unclustered", (e) => {
          const f = e.features?.[0]; if (!f) return;
          const alert = strikeAlerts.find((a) => a.id === f.properties.id);
          if (alert) showAlertPopup(alert, (f.geometry as any).coordinates);
        });
        map.on("mouseenter", "strike-clusters", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "strike-clusters", () => { map.getCanvas().style.cursor = ""; });
        map.on("mouseenter", "strike-unclustered", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "strike-unclustered", () => { map.getCanvas().style.cursor = ""; });
      }
    }

    /* Non-strike alerts (sirens, area highlights, generic) */
    visibleAlerts.filter((a) => a.type !== "strike" && a.type !== "artillery").forEach((alert) => {
      const isAreaHighlight = alert.type === "threat" || alert.type === "enemy_position" || alert.type === "army_position";
      const isSiren = alert.type?.startsWith("siren");

      if (isSiren) {
        const srcId = `siren-src-${alert.id}`, fillId = `siren-fill-${alert.id}`, lineId = `siren-line-${alert.id}`;
        if (map.getSource(srcId)) return; // already rendered
        const circle = createCircleGeoJSON(alert.lng, alert.lat, alert.radius || 3000);
        map.addSource(srcId, { type: "geojson", data: circle as any }); activeSourceIdsRef.current.push(srcId);
        map.addLayer({ id: fillId, type: "fill", source: srcId, paint: { "fill-color": "#E53935", "fill-opacity": 0.25 } });
        map.addLayer({ id: lineId, type: "line", source: srcId, paint: { "line-color": "#E53935", "line-width": 1.5, "line-dasharray": [4, 2] } });
        activeLayerIdsRef.current.push(fillId, lineId);
        const el = document.createElement("div"); el.className = "siren-marker";
        el.innerHTML = alert.type === "siren_drone"
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="12,3 4,14 8,14 8,12 12,8 16,12 16,14 20,14"/><rect x="11" y="14" width="2" height="7" rx="1"/><polygon points="7,16 12,21 17,16"/></svg>'
          : '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2c-.5 0-1 .2-1.3.6L8 7v3L5 13v2h4l-1 5.5c-.1.8.6 1.5 1.4 1.5h5.2c.8 0 1.5-.7 1.4-1.5L15 15h4v-2l-3-3V7l-2.7-4.4C13 2.2 12.5 2 12 2z"/></svg>';
        el.addEventListener("click", (e) => { e.stopPropagation(); showAlertPopup(alert, [alert.lng, alert.lat]); });
        strikeMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([alert.lng, alert.lat]).addTo(map));
        const ch = (ev: any) => showAlertPopup(alert, ev.lngLat);
        map.on("click", fillId, ch); cleanupHandlersRef.current.push(() => map.off("click", fillId, ch));
        return;
      }

      if (isAreaHighlight && userSettings.highlightAreas) {
        const admin3Data = geoCache.current.admin3;
        const areaInAdmin3 = admin3Data?.features?.some((f: any) => f.properties?.adm3_name1 === alert.area);
        if (areaInAdmin3) {
          const fId = `area-${alert.id}`, lId = `area-line-${alert.id}`;
          if (map.getLayer(fId)) return; // already rendered
          const color = alert.type === "threat" ? "#F59E0B" : alert.type === "enemy_position" ? "#A855F7" : "#22C55E";
          map.addLayer({ id: fId, type: "fill", source: "admin3", paint: { "fill-color": color, "fill-opacity": 0.35 }, filter: ["==", ["get", "adm3_name1"], alert.area] });
          map.addLayer({ id: lId, type: "line", source: "admin3", paint: { "line-color": color, "line-width": 2 }, filter: ["==", ["get", "adm3_name1"], alert.area] });
          activeLayerIdsRef.current.push(fId, lId);
          const ch = (ev: any) => {
            if (map.queryRenderedFeatures(ev.point, { layers: ["strike-unclustered"] }).length > 0) return;
            showAlertPopup(alert, ev.lngLat);
          };
          map.on("click", fId, ch); cleanupHandlersRef.current.push(() => map.off("click", fId, ch));
          return;
        }
        // Area not in admin3 — fall through to draw a coordinate-based circle
      }

      const srcId = `src-${alert.id}`, fId = `fill-${alert.id}`, lId = `line-${alert.id}`;
      if (map.getSource(srcId)) return; // already rendered
      const isHighlightFallback = isAreaHighlight && userSettings.highlightAreas;
      const circleColor = alert.color || "#5BA4E6";
      const circle = createCircleGeoJSON(alert.lng, alert.lat, alert.radius || 800);
      map.addSource(srcId, { type: "geojson", data: circle as any }); activeSourceIdsRef.current.push(srcId);
      map.addLayer({ id: fId, type: "fill", source: srcId, paint: { "fill-color": circleColor, "fill-opacity": isHighlightFallback ? 0.35 : 0.2 } });
      map.addLayer({ id: lId, type: "line", source: srcId, paint: { "line-color": circleColor, "line-width": isHighlightFallback ? 2 : 1.5 } });
      activeLayerIdsRef.current.push(fId, lId);
      const ch = (ev: any) => showAlertPopup(alert, ev.lngLat);
      map.on("click", fId, ch); cleanupHandlersRef.current.push(() => map.off("click", fId, ch));
    });

    // Area highlight fills are added after strike layers, so move strikes back on top
    // to keep them clickable even when a threat polygon covers the same location.
    if (map.getLayer("strike-unclustered")) {
      map.moveLayer("strike-clusters");
      map.moveLayer("strike-cluster-count");
      map.moveLayer("strike-unclustered");
    }
  }, [visibleAlerts, mapReady, userSettings.highlightAreas, theme, lang]);

  /* ── Preferred area auto-center on first load ──────── */
  useEffect(() => {
    if (!mapReady || !areasData.length || !userSettings.selectedArea) return;
    const area = areasData.find((a) => a.name === userSettings.selectedArea);
    if (area) mapInstance.current?.flyTo({ center: [area.lng, area.lat], zoom: 11.5, speed: 0.8 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, areasData.length]);

  const activeFilterLabel = FILTERS.find((f) => f.value === activeFilter)?.lk;

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <main className="h-screen flex flex-col" style={{ background: "var(--bg-deep)", color: "var(--text)" }} dir={isAr ? "rtl" : "ltr"}>

      {/* ─── HEADER ──────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-3 relative z-50 gap-2" style={{ background: "var(--bg-surface)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)" }}>

        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <img src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"} alt="البيان" width={34} height={34} />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold leading-tight">{t("siteName")}</h1>
            <p className="text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>{t("siteTagline")}</p>
          </div>
        </div>

        {/* Mobile search — always visible on mobile */}
        <div className="flex-1 mx-2 md:hidden relative">
          <input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full h-8 rounded-lg px-3 text-xs outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }} />
          {searchQuery && searchResults.length > 0 && (
            <div className="absolute top-10 left-0 right-0 glass-panel p-1 max-h-48 overflow-y-auto z-50">
              {searchResults.map((a) => (
                <button key={a.pcode} onClick={() => flyToArea(a)} className="w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition hover:opacity-80" style={{ background: "transparent" }}>
                  <span>{a.name}</span>
                  <span className="mx-1" style={{ color: "var(--text-muted)" }}>·</span>
                  <span style={{ color: "var(--text-muted)" }}>{a.district}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop center — status or expanded search */}
        <div className="hidden md:flex items-center gap-3 flex-1 justify-center">
          {searchOpen ? (
            <div className="relative w-full max-w-md">
              <input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus
                placeholder={t("searchPlaceholder")}
                className="w-full h-9 rounded-lg px-4 text-sm outline-none"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }} />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="absolute top-1.5 left-2 p-1 rounded" style={{ color: "var(--text-muted)" }}><X size={14} /></button>
              {searchQuery && searchResults.length > 0 && (
                <div className="absolute top-11 left-0 right-0 glass-panel p-1 max-h-56 overflow-y-auto z-50">
                  {searchResults.map((a) => (
                    <button key={a.pcode} onClick={() => flyToArea(a)} className="w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition hover:opacity-80">
                      <span>{a.name}</span><span className="mx-1" style={{ color: "var(--text-muted)" }}>·</span><span style={{ color: "var(--text-muted)" }}>{a.district}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />{t("live")}</span>
              <span style={{ color: "var(--border)" }}>|</span><span>{t("coverageLebanon")}</span>
              {sirenCount > 0 && (<><span style={{ color: "var(--border)" }}>|</span><span className="font-bold" style={{ color: "var(--accent)" }}>{t("sirensIn")} {sirenCount} {t("areas")}</span></>)}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={toggleLang} className="map-btn !w-8 !h-8 text-[10px] font-bold" title={isAr ? "English" : "عربي"}>{isAr ? "EN" : "ع"}</button>
          <button onClick={toggleTheme} className="map-btn !w-8 !h-8" title={theme === "dark" ? t("lightMode") : t("darkMode")}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</button>
          {/* Desktop search button */}
          <button onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }} className="hidden md:flex map-btn !w-8 !h-8"><Search size={15} /></button>
          <nav className="hidden md:flex items-center gap-1.5">
            <Link href="/settings" className="map-btn !w-8 !h-8"><Settings size={15} /></Link>
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="h-8 px-3 flex items-center rounded-lg text-xs font-bold" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>{t("telegram")}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="h-8 px-3 flex items-center rounded-lg text-xs font-bold" style={{ background: "var(--green-soft)", color: "var(--green)" }}>{t("whatsapp")}</a>
            <Link href="/donate" className="h-8 px-3 flex items-center rounded-lg text-xs font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{t("supportUs")}</Link>
            <Link href="/report" className="h-8 px-3 flex items-center rounded-lg text-xs font-bold text-white" style={{ background: "var(--accent)" }}>{t("report")}</Link>
          </nav>
          <div className="md:hidden"><button className="map-btn !w-8 !h-8" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}</button></div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-14 left-0 right-0 p-3 flex flex-col gap-1.5 md:hidden z-50" style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border)" }}>
            <Link href="/report" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold text-white" style={{ background: "var(--accent)" }}>{t("report")}</Link>
            <Link href="/donate" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{t("supportUs")}</Link>
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>{t("telegram")}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--green-soft)", color: "var(--green)" }}>{t("whatsapp")}</a>
            <Link href="/history" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--bg-card)" }}>History</Link>
            <Link href="/stats" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--bg-card)" }}>Stats</Link>
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--bg-card)" }}>{t("settings")}</Link>
          </div>
        )}
      </header>

      {/* ─── MAP AREA ────────────────────────────────── */}
      <div className="relative flex-1 w-full">
        {loading && <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg-deep)" }}><div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid var(--border)", borderTopColor: "var(--accent)" }} /><p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("loading")}</p></div>}

        {error && <div className="absolute top-0 left-0 right-0 z-30 px-4 py-2 text-center text-xs font-bold text-white" style={{ background: "var(--accent)" }}>{error} <button onClick={loadAlerts} className={`${isAr ? "mr-2" : "ml-2"} underline`}>{t("retry")}</button></div>}

        {connStatus === "reconnecting" && <div className="absolute top-0 left-0 right-0 z-30 px-4 py-1.5 text-center text-[10px] font-bold" style={{ background: "#F59E0B", color: "#000" }}>{t("reconnecting")}</div>}

        {userSettings.urgentBar && urgentAlerts.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-30 h-10 flex items-center justify-center text-white" style={{ background: "var(--accent)" }}>
            <span className="relative flex h-2 w-2 mx-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-white" /></span>
            <span className="font-black text-sm mx-2">{t("urgent")}</span>
            <span className="text-sm font-bold">{cleanLabel(urgentAlerts[0].type_label)} — {urgentAlerts[0].area}</span>
          </div>
        )}

        {/* Filter + Time + Layers panels */}
        <div className={`absolute z-20 ${isAr ? "right-3" : "left-3"} ${userSettings.urgentBar && urgentAlerts.length > 0 ? "top-14" : "top-3"} flex gap-2`}>
          {/* Filter */}
          <div className="relative">
            <button onClick={() => { setFilterPanelOpen(!filterPanelOpen); setLayerPanelOpen(false); }} className="glass-panel flex items-center gap-2 px-3 py-2 text-xs font-bold cursor-pointer">
              <Filter size={14} /><span>{t("filter")}</span>
              {activeFilter !== "all" && <span className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{ background: "var(--accent)" }}>{activeFilterLabel && t(activeFilterLabel)}</span>}
              {timeFilter !== "all" && <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>{timeFilter}</span>}
            </button>
            {filterPanelOpen && (
              <div className="glass-panel mt-2 p-3 w-56 space-y-1 absolute top-full">
                <p className="text-[10px] font-bold mb-1 tracking-widest" style={{ color: "var(--text-muted)" }}>{t("filter")}</p>
                {FILTERS.map((f) => (
                  <button key={f.value} onClick={() => { setActiveFilter(f.value); setFilterPanelOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition"
                    style={{ background: activeFilter === f.value ? "var(--accent)" : "transparent", color: activeFilter === f.value ? "white" : "var(--text-secondary)" }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: f.color || "var(--text-muted)" }} />
                    <span>{t(f.lk)}</span>
                  </button>
                ))}
                <div className="pt-2 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-bold mb-1 tracking-widest" style={{ color: "var(--text-muted)" }}><Clock size={10} className="inline mr-1" />{isAr ? "الفترة" : "Time"}</p>
                  <div className="flex gap-1">
                    {TIME_FILTERS.map((tf) => (
                      <button key={tf.value} onClick={() => setTimeFilter(tf.value)}
                        className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition"
                        style={{ background: timeFilter === tf.value ? "var(--blue)" : "var(--bg-card)", color: timeFilter === tf.value ? "white" : "var(--text-secondary)" }}>
                        {t(tf.lk)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Layers */}
          <div className="relative">
            <button onClick={() => { setLayerPanelOpen(!layerPanelOpen); setFilterPanelOpen(false); }} className="glass-panel flex items-center gap-2 px-3 py-2 text-xs font-bold cursor-pointer">
              <Layers size={14} /><span className="hidden sm:inline">{t("layers")}</span>
            </button>
            {layerPanelOpen && (
              <div className="glass-panel mt-2 p-3 w-52 space-y-1 absolute top-full">
                {(["default", "satellite"] as const).map((s) => (
                  <button key={s} onClick={() => changeMapStyle(s)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition"
                    style={{ background: mapStyle === s ? "var(--blue)" : "transparent", color: mapStyle === s ? "white" : "var(--text-secondary)" }}>
                    {s === "default" ? t("defaultMap") : t("satellite")}
                  </button>
                ))}
                <div className="pt-2 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
                  <button onClick={() => setShowHeatmap(!showHeatmap)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition"
                    style={{ background: showHeatmap ? "var(--accent)" : "transparent", color: showHeatmap ? "white" : "var(--text-secondary)" }}>
                    {t("heatmap")}
                  </button>
                </div>
                <div className="pt-2 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-bold mb-2 tracking-widest px-1" style={{ color: "var(--text-muted)" }}>{t("mapLegend")}</p>
                  <div className="space-y-1 text-[11px] px-1">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#EF4444] flex-shrink-0" /><span>{t("strikeArtillery")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-[#F59E0B] flex-shrink-0" /><span>{t("threat")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-[#A855F7] flex-shrink-0" /><span>{t("enemyPosition")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-[#22C55E] flex-shrink-0" /><span>{t("lebArmy")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#5BA4E6] flex-shrink-0" /><span>{t("droneActivity")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded border border-dashed border-[#E53935] bg-[#E53935]/25 flex-shrink-0" /><span>{t("sirenAlert")}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div ref={mapRef} className="h-full w-full" />

        {/* Zoom + Locate */}
        <div className={`absolute ${isAr ? "left-3" : "right-3"} z-20 flex flex-col gap-2 ${userSettings.urgentBar && urgentAlerts.length > 0 ? "top-14" : "top-3"}`}>
          <button onClick={zoomIn} className="map-btn" title={t("zoomIn")}><Plus size={16} /></button>
          <button onClick={zoomOut} className="map-btn" title={t("zoomOut")}><Minus size={16} /></button>
          <button onClick={locateUser} className="map-btn" title={t("myLocation")} style={{ color: "var(--blue)" }}><LocateFixed size={16} /></button>
        </div>

        {/* Legend is now inside the Layers panel */}

        {/* Events panel */}
        <div className={`absolute ${isAr ? "left-3" : "right-3"} bottom-12 z-10`}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="glass-panel flex items-center gap-2 px-3 py-2 text-xs font-bold cursor-pointer"
            style={{ borderTopLeftRadius: sidebarOpen ? 0 : 12, borderTopRightRadius: sidebarOpen ? 0 : 12, borderTop: sidebarOpen ? "none" : undefined, width: sidebarOpen ? "280px" : "auto" }}>
            <span className="px-1.5 py-0.5 rounded text-[10px] text-white min-w-[20px] text-center" style={{ background: "var(--accent)" }}>{visibleAlerts.length}</span>
            <span className="flex-1 text-right">{sidebarOpen ? t("liveEvents") : t("events")}</span>
            {sidebarOpen ? <ChevronDown size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronUp size={14} style={{ color: "var(--text-muted)" }} />}
          </button>
          {sidebarOpen && (
            <div className="w-[280px] max-h-[50vh] overflow-y-auto rounded-t-xl absolute bottom-full left-0"
              style={{ background: "var(--bg-surface)", backdropFilter: "blur(16px)", border: "1px solid var(--border)", borderBottom: "none" }}>
              <div className="p-2 space-y-1.5">
                {visibleAlerts.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>{t("noEvents")}</p>
                ) : visibleAlerts.map((alert) => {
                  const color = TYPE_COLORS[alert.type] || "#5BA4E6";
                  return (
                    <button key={alert.id} onClick={() => openAlert(alert)} className="w-full text-right rounded-lg p-3 transition relative overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                      <div className={`absolute ${isAr ? "right-0" : "left-0"} top-0 bottom-0 w-[3px]`} style={{ backgroundColor: color, borderRadius: isAr ? "0 8px 8px 0" : "8px 0 0 8px" }} />
                      <div className={isAr ? "pr-3" : "pl-3"}>
                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold" style={{ color }}>{cleanLabel(alert.type_label)}</span><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{getTimeAgo(alert.created_at, isAr)}</span></div>
                        <div className="text-sm mt-1 font-bold">{alert.area}</div>
                        {alert.description && <div className="text-[11px] mt-1 line-clamp-1" style={{ color: "var(--text-secondary)" }}>{alert.description}</div>}
                        <div className="text-[10px] mt-1.5" style={{ color: "#F59E0B" }}>{t("expiresIn")} {getRemainingTime(alert.expires_at, isAr)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center h-8 text-[10px]"
          style={{ background: "var(--bg-surface)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
          <span>{t("siteName")} — {t("liveMap")}</span>
          <span className="mx-2">|</span>
          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500" />{t("live")}</span>
          <span className="mx-2">|</span>
          <Link href="/history" className="hover:underline">History</Link>
          <span className="mx-2">|</span>
          <Link href="/stats" className="hover:underline">Stats</Link>
        </div>
      </div>
    </main>
  );
}
