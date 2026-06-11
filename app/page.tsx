"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Settings, Menu, X, LocateFixed, ChevronUp, ChevronDown,
  Sun, Moon, Layers, Filter, Plus, Minus, Search, Share2, Clock, Ruler, X as XIcon, ChevronLeft, ChevronRight,
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
  if (f === "siren") return a.type === "siren" || a.type === "siren_missile" || a.type === "siren_drone" || a.type === "red_alert";
  return a.type === f;
}

function matchesTimeFilter(a: AlertItem, tf: string) {
  if (tf === "all" || !a.created_at) return true;
  const hours = tf === "1h" ? 1 : tf === "6h" ? 6 : 24;
  return Date.now() - new Date(a.created_at).getTime() < hours * 3600000;
}

/* ─── Sound + Notifications (works in background) ─── */
const SOUND_FILES: Record<string, string> = {
  beep: "/sounds/alert-beep.wav",
  alarm: "/sounds/alert-alarm.wav",
  chime: "/sounds/alert-chime.wav",
  siren: "/sounds/alert-siren.wav",
};

function playAlertSound(type = "beep") {
  try {
    const src = SOUND_FILES[type] || SOUND_FILES.beep;
    const audio = new Audio(src);
    audio.volume = 0.35;
    audio.play().catch(() => {
      // Fallback: AudioContext (foreground only)
      try {
        const ctx = new AudioContext();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 880; o.type = "sine"; g.gain.value = 0.12;
        o.start(); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        o.stop(ctx.currentTime + 0.3);
      } catch {}
    });
  } catch {}
}

function sendNotification(title: string, body: string) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification(title, { body, icon: "/logo-dark.png", badge: "/logo-dark.png", tag: "albayan-" + Date.now(), requireInteraction: false });
  } catch {}
}

function requestNotificationPermission() {
  try {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  } catch {}
}

const TYPE_COLORS: Record<string, string> = {
  strike: "#EF4444", artillery: "#F97316", drone: "#5BA4E6", threat: "#F59E0B",
  enemy_position: "#A855F7", army_position: "#22C55E", traffic: "#38BDF8",
  crowd: "#DC2626", fire: "#F97316", injuries: "#E11D48",
  quadcopter: "#06B6D4", helicopter: "#64748B", warplanes: "#6366F1",
  siren: "#E53935", siren_missile: "#E53935", siren_drone: "#E53935", red_alert: "#EF4444",
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
  quadcopter: "Quadcopter", helicopter: "Helicopter", warplanes: "Warplanes",
  siren: "Siren", siren_missile: "Missile Siren", siren_drone: "Drone Siren", red_alert: "Red Alert",
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
  const pubLabel = isAr ? "وقت النشر" : "Published";
  const pubTime = alert.created_at ? new Date(alert.created_at).toLocaleTimeString(isAr ? "ar-LB" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—";
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
        <span style="color:${muted};font-size:11px;font-weight:600;">${pubLabel}</span>
        <span style="color:#5BA4E6;font-weight:700;font-size:13px;">${pubTime}</span>
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
  { value: "quadcopter", lk: "quadcopters" as const, color: "#06B6D4" },
  { value: "helicopter", lk: "helicopters" as const, color: "#64748B" },
  { value: "warplanes", lk: "warplanes" as const, color: "#6366F1" },
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
  const geoCache = useRef<{ admin3?: any }>({});

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

  /* Distance measurement */
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const measureMarkersRef = useRef<maplibregl.Marker[]>([]);
  const measureLineRef = useRef<string | null>(null);

  /* Alert detail drawer */
  const [drawerAlert, setDrawerAlert] = useState<AlertItem | null>(null);
  const [showSupportPopup, setShowSupportPopup] = useState(false);

  /* Onboarding tour */
  const [tourStep, setTourStep] = useState(-1); // -1 = not shown
  const [tourRect, setTourRect] = useState<DOMRect | null>(null);
  const TOUR_STEPS = useMemo(() => [
    { id: "welcome", target: null,
      title: isAr ? "مرحبًا بك في البيان الإخباري" : "Welcome to AlBayan News",
      desc: isAr ? "خريطة تنبيهات لبنان الحية. دعنا نأخذك في جولة سريعة." : "Lebanon's live alert map. Let us give you a quick tour.",
      pos: "center" as const },
    { id: "status", target: "[data-tour='status']",
      title: isAr ? "حالة الاتصال" : "Connection Status",
      desc: isAr ? "النقطة الخضراء تعني أنك متصل وتتلقى التنبيهات لحظيًا." : "The green dot means you're connected and receiving alerts in real time.",
      pos: "below" as const },
    { id: "filter", target: "[data-tour='filter']",
      title: isAr ? "تصفية الأحداث" : "Filter Alerts",
      desc: isAr ? "اختر أنواع التنبيهات التي تريد عرضها: غارات، مسيّرات، تهديدات، صفارات إنذار، وغيرها. يمكنك أيضًا التصفية حسب الوقت." : "Choose which alert types to display: strikes, drones, threats, sirens, and more. You can also filter by time period.",
      pos: "bottom" as const },
    { id: "events", target: "[data-tour='events']",
      title: isAr ? "قائمة الأحداث" : "Events List",
      desc: isAr ? "اضغط هنا لعرض جميع التنبيهات في قائمة. اضغط على أي حدث للانتقال إليه على الخريطة." : "Tap here to see all active alerts in a list. Tap any alert to fly to it on the map and see full details.",
      pos: "above" as const },
    { id: "layers", target: "[data-tour='layers']",
      title: isAr ? "طبقات الخريطة" : "Map Layers",
      desc: isAr ? "بدّل بين الخريطة العادية والأقمار الاصطناعية، أو فعّل خريطة الحرارة." : "Switch between standard and satellite view, or enable the heatmap overlay.",
      pos: "bottom" as const },
    { id: "tools", target: "[data-tour='tools']",
      title: isAr ? "أدوات الخريطة" : "Map Tools",
      desc: isAr ? "تكبير/تصغير · تحديد موقعك · قياس المسافة بين نقطتين. اختصارات: F=تصفية S=بحث L=موقع" : "Zoom in/out · Find your location · Measure distance between two points. Shortcuts: F=Filter S=Search L=Locate",
      pos: isAr ? "right" as const : "left" as const },
    { id: "done", target: null,
      title: isAr ? "أنت جاهز!" : "You're all set!",
      desc: isAr ? "فعّل الإشعارات لتلقي التنبيهات حتى عندما يكون المتصفح في الخلفية. ساعدنا على الاستمرار بدعمك!" : "Enable notifications to get alerts even when the browser is in the background. Help us keep going with your support!",
      pos: "center" as const },
  ], [isAr]);

  function finishTour() {
    setTourStep(-1); setTourRect(null);
    setFilterPanelOpen(false); setLayerPanelOpen(false);
    try { localStorage.setItem("albayan-onboarded", "1"); } catch {}
    requestNotificationPermission();
    // Show the support popup after a brief delay
    setTimeout(() => setShowSupportPopup(true), 600);
  }

  // Update highlight rect + open relevant panels when tour step changes
  useEffect(() => {
    if (tourStep < 0 || tourStep >= TOUR_STEPS.length) { setTourRect(null); return; }
    const step = TOUR_STEPS[tourStep];

    // Open/close panels based on current step
    setFilterPanelOpen(step.id === "filter");
    setLayerPanelOpen(step.id === "layers");

    if (!step.target) { setTourRect(null); return; }

    // Small delay so panels render before we measure
    const timer = setTimeout(() => {
      const el = document.querySelector(step.target!);
      if (!el) { setTourRect(null); return; }

      const btnRect = el.getBoundingClientRect();

      // For filter/layers, combine button rect with the dropdown panel rect
      if (step.id === "filter" || step.id === "layers") {
        const dropdown = document.querySelector(`[data-tour-dropdown="${step.id}"]`);
        if (dropdown) {
          const ddRect = dropdown.getBoundingClientRect();
          const top = Math.min(btnRect.top, ddRect.top);
          const left = Math.min(btnRect.left, ddRect.left);
          const bottom = Math.max(btnRect.bottom, ddRect.bottom);
          const right = Math.max(btnRect.right, ddRect.right);
          setTourRect(new DOMRect(left, top, right - left, bottom - top));
          return;
        }
      }

      setTourRect(btnRect);
    }, step.id === "filter" || step.id === "layers" ? 150 : 0);

    return () => clearTimeout(timer);
  }, [tourStep, TOUR_STEPS]);

  // Support popup — show once after 5 minutes
  useEffect(() => {
    try { if (localStorage.getItem("albayan-support-dismissed")) return; } catch {}
    const timer = setTimeout(() => setShowSupportPopup(true), 5 * 60 * 1000);
    return () => clearTimeout(timer);
  }, []);

  // Tour — show on first visit
  useEffect(() => {
    try {
      if (!localStorage.getItem("albayan-onboarded")) setTourStep(0);
    } catch {}
    requestNotificationPermission();
  }, []);

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
  const sirenCount = useMemo(() => alerts.filter((a) => a.type?.startsWith("siren") || a.type === "red_alert").length, [alerts]);

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
      const prev = prevAlertIdsRef.current;
      if (prev.size > 0) {
        const freshAlerts = newAlerts.filter(a => !prev.has(a.id));
        if (freshAlerts.length > 0 && userSettings.soundEnabled) {
          const hasSiren = freshAlerts.some(a => a.type?.startsWith("siren") || a.type === "red_alert");
          const hasUrgent = freshAlerts.some(a => a.is_urgent);
          playAlertSound(hasSiren ? "siren" : hasUrgent ? "alarm" : userSettings.soundType);
          // System notification (works in background)
          const first = freshAlerts[0];
          const label = cleanLabel(first.type_label);
          sendNotification(
            `${label} — ${first.area}`,
            first.description || (freshAlerts.length > 1 ? `+${freshAlerts.length - 1} تنبيهات أخرى` : "تنبيه جديد على البيان الإخباري")
          );
        }
      }
      prevAlertIdsRef.current = new Set(newAlerts.map((a) => a.id));
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

  /* ── Distance measurement ─────────────────────────── */
  function toggleMeasure() {
    if (measureMode) {
      // Clear measurement
      measureMarkersRef.current.forEach(m => m.remove());
      measureMarkersRef.current = [];
      setMeasurePoints([]);
      const map = mapInstance.current;
      if (map && measureLineRef.current) {
        if (map.getLayer(measureLineRef.current)) map.removeLayer(measureLineRef.current);
        if (map.getSource(measureLineRef.current)) map.removeSource(measureLineRef.current);
        measureLineRef.current = null;
      }
    }
    setMeasureMode(!measureMode);
  }

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;
    if (!measureMode) return;

    function handleClick(e: maplibregl.MapMouseEvent) {
      const m = mapInstance.current;
      if (!m) return;
      const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setMeasurePoints(prev => {
        const next = [...prev, point].slice(-2) as [number, number][];
        // Add marker
        const el = document.createElement("div");
        el.style.cssText = "width:10px;height:10px;background:#F59E0B;border:2px solid white;border-radius:50%;box-shadow:0 0 6px rgba(245,158,11,0.5)";
        if (measureMarkersRef.current.length >= 2) {
          measureMarkersRef.current.forEach(mk => mk.remove());
          measureMarkersRef.current = [];
        }
        measureMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat(point).addTo(m));

        // Draw line if 2 points
        if (next.length === 2) {
          const lineId = "measure-line";
          if (m.getLayer(lineId)) m.removeLayer(lineId);
          if (m.getSource(lineId)) m.removeSource(lineId);
          m.addSource(lineId, {
            type: "geojson",
            data: { type: "Feature", geometry: { type: "LineString", coordinates: next }, properties: {} }
          });
          m.addLayer({
            id: lineId, type: "line", source: lineId,
            paint: { "line-color": "#F59E0B", "line-width": 2, "line-dasharray": [4, 4] }
          });
          measureLineRef.current = lineId;
        }
        return next;
      });
    }

    map.on("click", handleClick);
    map.getCanvas().style.cursor = "crosshair";
    return () => {
      map.off("click", handleClick);
      map.getCanvas().style.cursor = "";
    };
  }, [measureMode, mapReady]);

  const measureDistance = useMemo(() => {
    if (measurePoints.length !== 2) return null;
    const [a, b] = measurePoints;
    const R = 6371;
    const dLat = (b[1] - a[1]) * Math.PI / 180;
    const dLon = (b[0] - a[0]) * Math.PI / 180;
    const lat1 = a[1] * Math.PI / 180, lat2 = b[1] * Math.PI / 180;
    const x = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const dist = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
  }, [measurePoints]);

  function openDrawer(alert: AlertItem) {
    setSidebarOpen(false);
    setDrawerAlert(alert);
    const map = mapInstance.current;
    if (map) map.flyTo({ center: [alert.lng, alert.lat], zoom: 13.5, speed: 1.2 });
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
      if (e.key === "Escape") { setFilterPanelOpen(false); setLayerPanelOpen(false); setSearchOpen(false); setSearchQuery(""); setDrawerAlert(null); if (activePopupRef.current) activePopupRef.current.remove(); }
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

    /* Non-strike alerts first so area fills sit below strike dots */
    visibleAlerts.filter((a) => a.type !== "strike" && a.type !== "artillery").forEach((alert) => {
      const isAreaHighlight = alert.type === "threat" || alert.type === "enemy_position" || alert.type === "army_position";
      const isSiren = alert.type?.startsWith("siren") || alert.type === "red_alert";

      if (isSiren) {
        const srcId = `siren-src-${alert.id}`, fillId = `siren-fill-${alert.id}`, lineId = `siren-line-${alert.id}`;
        if (map.getSource(srcId)) return; // already rendered
        const sirenRadius = Math.min(alert.radius || 3000, 3500); // cap at 3.5km
        const circle = createCircleGeoJSON(alert.lng, alert.lat, sirenRadius);
        map.addSource(srcId, { type: "geojson", data: circle as any }); activeSourceIdsRef.current.push(srcId);
        map.addLayer({ id: fillId, type: "fill", source: srcId, paint: { "fill-color": "#E53935", "fill-opacity": 0.15 } });
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

      /* ── Quadcopter marker ── */
      if (alert.type === "quadcopter") {
        const el = document.createElement("div"); el.className = "quadcopter-marker";
        el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><circle cx="5" cy="5" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><rect x="10" y="4" width="4" height="16" rx="2"/><rect x="4" y="10" width="16" height="4" rx="2"/></svg>';
        el.addEventListener("click", (e) => { e.stopPropagation(); showAlertPopup(alert, [alert.lng, alert.lat]); });
        strikeMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([alert.lng, alert.lat]).addTo(map));
        return;
      }

      /* ── Helicopter marker ── */
      if (alert.type === "helicopter") {
        const el = document.createElement("div"); el.className = "helicopter-marker";
        el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M3 3h18v2H3zm6 4h6l3 4v2h-2l-1.5 5H9.5L8 13H6v-2l3-4zm3 2a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/><rect x="11" y="2" width="2" height="4"/></svg>';
        el.addEventListener("click", (e) => { e.stopPropagation(); showAlertPopup(alert, [alert.lng, alert.lat]); });
        strikeMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([alert.lng, alert.lat]).addTo(map));
        return;
      }

      /* ── Warplanes — transparent circle with dotted outline ── */
      if (alert.type === "warplanes") {
        const srcId = `warplane-src-${alert.id}`, lineId = `warplane-line-${alert.id}`;
        if (map.getSource(srcId)) return;
        const circle = createCircleGeoJSON(alert.lng, alert.lat, alert.radius || 5000);
        map.addSource(srcId, { type: "geojson", data: circle as any }); activeSourceIdsRef.current.push(srcId);
        // NO fill layer — transparent center. Only a dashed outline.
        map.addLayer({ id: lineId, type: "line", source: srcId, paint: { "line-color": "#6366F1", "line-width": 2, "line-dasharray": [3, 3] } });
        activeLayerIdsRef.current.push(lineId);
        const el = document.createElement("div"); el.className = "warplane-marker";
        el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>';
        el.addEventListener("click", (e) => { e.stopPropagation(); showAlertPopup(alert, [alert.lng, alert.lat]); });
        strikeMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([alert.lng, alert.lat]).addTo(map));
        const ch = (ev: any) => showAlertPopup(alert, ev.lngLat);
        map.on("click", lineId, ch); cleanupHandlersRef.current.push(() => map.off("click", lineId, ch));
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

    /* Strike + artillery layers — last, so they render on top of area fills */
    const strikeOnly = visibleAlerts.filter((a) => a.type === "strike");
    const artilleryOnly = visibleAlerts.filter((a) => a.type === "artillery");

    /* ── Airstrikes: red clustered circles ── */
    if (strikeOnly.length > 0) {
      const fc = { type: "FeatureCollection", features: strikeOnly.map((a) => ({ type: "Feature", geometry: { type: "Point", coordinates: [a.lng, a.lat] }, properties: { id: a.id } })) };
      if (!map.getSource("strikes-cluster")) {
        map.addSource("strikes-cluster", { type: "geojson", data: fc as any, cluster: true, clusterMaxZoom: 14, clusterRadius: 45 });
        activeSourceIdsRef.current.push("strikes-cluster");
      } else {
        (map.getSource("strikes-cluster") as maplibregl.GeoJSONSource).setData(fc as any);
      }
      if (!map.getLayer("strike-clusters")) {
        map.addLayer({ id: "strike-clusters", type: "circle", source: "strikes-cluster", filter: ["has", "point_count"],
          paint: { "circle-color": "#EF4444", "circle-radius": ["step", ["get", "point_count"], 14, 5, 18, 15, 22, 30, 24], "circle-opacity": 0.85, "circle-stroke-width": 2, "circle-stroke-color": "rgba(255,255,255,0.8)" } });
        map.addLayer({ id: "strike-cluster-count", type: "symbol", source: "strikes-cluster", filter: ["has", "point_count"],
          layout: { "text-field": "{point_count_abbreviated}", "text-size": 11 }, paint: { "text-color": "#ffffff" } });
        map.addLayer({ id: "strike-unclustered", type: "circle", source: "strikes-cluster", filter: ["!", ["has", "point_count"]],
          paint: { "circle-color": "#EF4444", "circle-radius": 6, "circle-opacity": 0.9, "circle-stroke-width": 2, "circle-stroke-color": "rgba(255,255,255,0.85)" } });
        activeLayerIdsRef.current.push("strike-clusters", "strike-cluster-count", "strike-unclustered");

        map.on("click", "strike-clusters", (e) => {
          const f = e.features?.[0]; if (!f) return;
          const clusterId = f.properties.cluster_id;
          const clusterCoords = (f.geometry as any).coordinates as [number, number];
          const src = map.getSource("strikes-cluster") as maplibregl.GeoJSONSource;
          src.getClusterLeaves(clusterId, 100, 0).then((leaves) => {
            const tempMarkers: maplibregl.Marker[] = [];
            leaves.forEach((leaf, i) => {
              const realCoords = (leaf.geometry as any).coordinates as [number, number];
              const el = document.createElement("div");
              el.style.cssText = `width:12px;height:12px;background:#EF4444;border:2px solid rgba(255,255,255,0.85);border-radius:50%;transition:transform 0.5s cubic-bezier(0.34,1.56,0.64,1),opacity 0.4s;opacity:0.9;z-index:${10 + i};pointer-events:none;`;
              const marker = new maplibregl.Marker({ element: el }).setLngLat(clusterCoords).addTo(map);
              tempMarkers.push(marker);
              setTimeout(() => { marker.setLngLat(realCoords); }, 30 + i * 40);
            });
            setTimeout(() => {
              src.getClusterExpansionZoom(clusterId).then((zoom) => {
                map.easeTo({ center: clusterCoords, zoom: Math.min(zoom + 0.5, 15), duration: 400, easing: (t) => t * (2 - t) });
              });
              setTimeout(() => { tempMarkers.forEach(m => m.remove()); }, 500);
            }, 200 + leaves.length * 40);
          }).catch(() => {
            src.getClusterExpansionZoom(clusterId).then((zoom) => {
              map.easeTo({ center: clusterCoords, zoom: Math.min(zoom + 0.5, 15), duration: 500, easing: (t) => t * (2 - t) });
            });
          });
        });
        map.on("click", "strike-unclustered", (e) => {
          const f = e.features?.[0]; if (!f) return;
          const alert = strikeOnly.find((a) => a.id === f.properties.id);
          if (alert) showAlertPopup(alert, (f.geometry as any).coordinates);
        });
        map.on("mouseenter", "strike-clusters", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "strike-clusters", () => { map.getCanvas().style.cursor = ""; });
        map.on("mouseenter", "strike-unclustered", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "strike-unclustered", () => { map.getCanvas().style.cursor = ""; });
      }
    }

    /* ── Artillery: orange diamond DOM markers ── */
    artilleryOnly.forEach((alert) => {
      const el = document.createElement("div");
      el.className = "artillery-marker";
      el.style.cssText = "width:14px;height:14px;background:#F97316;border:2px solid rgba(255,255,255,0.85);transform:rotate(45deg);cursor:pointer;box-shadow:0 0 6px rgba(249,115,22,0.5);";
      el.addEventListener("click", (ev) => { ev.stopPropagation(); showAlertPopup(alert, [alert.lng, alert.lat]); });
      strikeMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([alert.lng, alert.lat]).addTo(map));
    });
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
            <div data-tour="status" className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
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
          <div className="md:hidden"><button className="map-btn !w-8 !h-8" onClick={() => { setMobileMenuOpen(!mobileMenuOpen); if (!mobileMenuOpen) { setSidebarOpen(false); setDrawerAlert(null); } }}>{mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}</button></div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-14 left-0 right-0 p-3 flex flex-col gap-1.5 md:hidden z-50" style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border)" }}>
            <Link href="/report" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold text-white" style={{ background: "var(--accent)" }}>{t("report")}</Link>
            <Link href="/donate" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{t("supportUs")}</Link>
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>{t("telegram")}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--green-soft)", color: "var(--green)" }}>{t("whatsapp")}</a>
            <Link href="/history" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--bg-card)" }}>{isAr ? "سجل التنبيهات" : "History"}</Link>
            <Link href="/stats" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--bg-card)" }}>{isAr ? "إحصائيات" : "Stats"}</Link>
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-center text-sm font-bold" style={{ background: "var(--bg-card)" }}>{t("settings")}</Link>
          </div>
        )}
      </header>

      {/* ─── MAP AREA ────────────────────────────────── */}
      <div className="relative flex-1 w-full">
        {loading && (
          <div className="absolute inset-0 z-40" style={{ background: "var(--bg-deep)" }}>
            {/* Map skeleton — subtle animated shimmer */}
            <div className="absolute inset-0" style={{ background: "var(--bg-deep)" }}>
              {/* Fake map tiles */}
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
            </div>
            {/* Fake filter bar skeleton */}
            <div className={`absolute z-10 ${isAr ? "right-3" : "left-3"} top-3 flex gap-2`}>
              <div className="skeleton-shimmer h-9 w-24 rounded-xl" />
              <div className="skeleton-shimmer h-9 w-16 rounded-xl" />
            </div>
            {/* Fake zoom controls */}
            <div className={`absolute z-10 ${isAr ? "left-3" : "right-3"} top-3 flex flex-col gap-2`}>
              <div className="skeleton-shimmer h-9 w-9 rounded-xl" />
              <div className="skeleton-shimmer h-9 w-9 rounded-xl" />
              <div className="skeleton-shimmer h-9 w-9 rounded-xl" />
            </div>
            {/* Fake event cards */}
            <div className={`absolute ${isAr ? "left-3" : "right-3"} bottom-12 flex flex-col gap-2 w-72 hidden md:flex`}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-shimmer h-20 rounded-xl" style={{ opacity: 1 - i * 0.25 }} />
              ))}
            </div>
            {/* Center loading indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
              <img src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"} alt="" width={48} height={48} className="animate-pulse" />
              <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{t("loading")}</p>
            </div>
            <style>{`
              .skeleton-shimmer {
                background: var(--bg-card);
                border: 1px solid var(--border);
                position: relative;
                overflow: hidden;
              }
              .skeleton-shimmer::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, transparent, var(--bg-surface), transparent);
                animation: shimmer 1.5s infinite;
              }
              @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            `}</style>
          </div>
        )}

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
          <div data-tour="filter" className="relative" style={tourStep === 2 ? { zIndex: 101 } : undefined}>
            <button onClick={() => { setFilterPanelOpen(!filterPanelOpen); setLayerPanelOpen(false); }} className="glass-panel flex items-center gap-2 px-3 py-2 text-xs font-bold cursor-pointer">
              <Filter size={14} /><span>{t("filter")}</span>
              {activeFilter !== "all" && <span className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{ background: "var(--accent)" }}>{activeFilterLabel && t(activeFilterLabel)}</span>}
              {timeFilter !== "all" && <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>{timeFilter}</span>}
            </button>
            {filterPanelOpen && (
              <div data-tour-dropdown="filter" className="glass-panel mt-2 p-3 w-56 space-y-1 absolute top-full">
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
          <div data-tour="layers" className="relative" style={tourStep === 4 ? { zIndex: 101 } : undefined}>
            <button onClick={() => { setLayerPanelOpen(!layerPanelOpen); setFilterPanelOpen(false); }} className="glass-panel flex items-center gap-2 px-3 py-2 text-xs font-bold cursor-pointer">
              <Layers size={14} /><span className="hidden sm:inline">{t("layers")}</span>
            </button>
            {layerPanelOpen && (
              <div data-tour-dropdown="layers" className="glass-panel mt-2 p-3 w-52 space-y-1 absolute top-full">
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
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#EF4444] flex-shrink-0" /><span>{isAr ? "غارة جوية" : "Airstrike"}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 bg-[#F97316] flex-shrink-0" style={{ transform: "rotate(45deg)" }} /><span>{isAr ? "قصف مدفعي" : "Artillery"}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-[#F59E0B] flex-shrink-0" /><span>{t("threat")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-[#A855F7] flex-shrink-0" /><span>{t("enemyPosition")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-[#22C55E] flex-shrink-0" /><span>{t("lebArmy")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#5BA4E6] flex-shrink-0" /><span>{t("droneActivity")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#06B6D4] flex-shrink-0" /><span>{t("quadcopters")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#64748B] flex-shrink-0" /><span>{t("helicopters")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded border border-dashed border-[#6366F1] flex-shrink-0" /><span>{t("warplanes")}</span></div>
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
        <div data-tour="tools" className={`absolute ${isAr ? "left-3" : "right-3"} z-20 flex flex-col gap-2 ${userSettings.urgentBar && urgentAlerts.length > 0 ? "top-14" : "top-3"}`}>
          <button onClick={zoomIn} className="map-btn" title={t("zoomIn")}><Plus size={16} /></button>
          <button onClick={zoomOut} className="map-btn" title={t("zoomOut")}><Minus size={16} /></button>
          <button onClick={locateUser} className="map-btn" title={t("myLocation")} style={{ color: "var(--blue)" }}><LocateFixed size={16} /></button>
          <button onClick={toggleMeasure} className="map-btn" title={isAr ? "قياس المسافة" : "Measure distance"} style={{ color: measureMode ? "#F59E0B" : "var(--text-secondary)", background: measureMode ? "rgba(245,158,11,0.1)" : "var(--bg-surface)" }}><Ruler size={16} /></button>
        </div>

        {/* Legend is now inside the Layers panel */}

        {/* Events side panel */}
        <div className={`absolute top-[56px] ${isAr ? "left-0" : "right-0"} z-20 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-full md:w-[360px]" : "w-0"}`}
          style={{ bottom: 0, background: "var(--bg-main)", borderLeft: isAr ? "none" : "1px solid var(--border)", borderRight: isAr ? "1px solid var(--border)" : "none", boxShadow: sidebarOpen ? "-4px 0 24px rgba(0,0,0,0.15)" : "none", overflow: "hidden" }}>
          {sidebarOpen && (<>
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 className="text-base font-extrabold">{visibleAlerts.length} {isAr ? "تنبيه" : "alerts"}</h2>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{isAr ? "الأحداث النشطة على الخريطة" : "Active alerts on the map"}</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer" }}><XIcon size={14} /></button>
            </div>
            {/* Alert list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {visibleAlerts.length === 0 ? (
                <p className="text-xs text-center py-12" style={{ color: "var(--text-muted)" }}>{t("noEvents")}</p>
              ) : visibleAlerts.map((alert) => {
                const color = TYPE_COLORS[alert.type] || "#5BA4E6";
                const typeLabel = isAr ? cleanLabel(alert.type_label) : (TYPE_LABELS_EN[alert.type] || cleanLabel(alert.type_label));
                const timeAgo = getTimeAgo(alert.created_at, isAr);
                const fullTime = alert.created_at ? new Date(alert.created_at).toLocaleString(isAr ? "ar-LB" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "";
                return (
                  <button key={alert.id} onClick={() => { setSidebarOpen(false); setDrawerAlert(alert); mapInstance.current?.flyTo({ center: [alert.lng, alert.lat], zoom: 13.5, speed: 1.2 }); }}
                    className="w-full rounded-xl p-4 transition relative overflow-hidden group" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", textAlign: isAr ? "right" : "left" }}>
                    <div className={`absolute ${isAr ? "right-0" : "left-0"} top-0 bottom-0 w-[3px]`} style={{ backgroundColor: color }} />
                    <div className={isAr ? "pr-3" : "pl-3"}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color }}>{typeLabel}</span>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{timeAgo} · {fullTime}</span>
                      </div>
                      <div className="text-[15px] font-extrabold leading-snug">{alert.type_label ? cleanLabel(alert.type_label) : ""} — {alert.area}</div>
                      {alert.description && <div className="text-[11px] mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{alert.description}</div>}
                      <div className="flex items-center gap-3 mt-2.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                          <Clock size={9} className="inline -mt-px" style={{ marginInlineEnd: "3px" }} />{getRemainingTime(alert.expires_at, isAr)}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${SITE_URL}/?alert=${alert.id}`); }} className="text-[10px] flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <Share2 size={10} /> {isAr ? "مشاركة" : "Share"}
                        </button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>)}
        </div>

        {/* Events toggle button (when panel is closed) */}
        {!sidebarOpen && !drawerAlert && (
          <button data-tour="events" onClick={() => { setSidebarOpen(true); setDrawerAlert(null); setMobileMenuOpen(false); setFilterPanelOpen(false); setLayerPanelOpen(false); }}
            className={`absolute ${isAr ? "left-3" : "right-3"} bottom-24 md:bottom-12 z-10 glass-panel flex items-center gap-2 px-3 py-2 text-xs font-bold cursor-pointer`}>
            <span className="px-1.5 py-0.5 rounded text-[10px] text-white min-w-[20px] text-center" style={{ background: "var(--accent)" }}>{visibleAlerts.length}</span>
            <span>{t("events")}</span>
            <ChevronUp size={14} style={{ color: "var(--text-muted)" }} />
          </button>
        )}

        {/* Measure distance display */}
        {measureMode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 glass-panel px-4 py-2 text-center pointer-events-none">
            {measureDistance ? (
              <span className="text-sm font-bold" style={{ color: "#F59E0B" }}>{measureDistance}</span>
            ) : (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{isAr ? "اضغط على نقطتين لقياس المسافة" : "Tap two points to measure"}</span>
            )}
          </div>
        )}

        {/* Alert detail side panel */}
        {drawerAlert && (
          <div className={`absolute top-[56px] ${isAr ? "left-0" : "right-0"} z-30 w-full md:w-[400px] flex flex-col`}
            style={{ bottom: 0, background: "var(--bg-main)", borderLeft: isAr ? "none" : "1px solid var(--border)", borderRight: isAr ? "1px solid var(--border)" : "none", boxShadow: "-4px 0 24px rgba(0,0,0,0.25)" }}>
            {/* Detail header */}
            <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <button onClick={() => { setDrawerAlert(null); setSidebarOpen(true); }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer" }}>
                  {isAr ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                  <span className="md:hidden">{isAr ? "الأحداث" : "Events"}</span>
                  <XIcon size={14} className="hidden md:block" />
                </button>
                <span className="text-sm font-extrabold">{isAr ? "تفاصيل التنبيه" : "Alert Details"}</span>
              </div>
              <div className="flex gap-1.5">
                {(() => { const idx = visibleAlerts.findIndex(a => a.id === drawerAlert.id); const prev = idx > 0 ? visibleAlerts[idx - 1] : null; const next = idx < visibleAlerts.length - 1 ? visibleAlerts[idx + 1] : null; return (<>
                  <button onClick={() => { if (prev) { setDrawerAlert(prev); mapInstance.current?.flyTo({ center: [prev.lng, prev.lat], zoom: 13.5, speed: 1.2 }); } }} disabled={!prev} className="w-8 h-8 flex items-center justify-center rounded-lg text-[10px]" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: prev ? "var(--text)" : "var(--text-muted)", cursor: prev ? "pointer" : "default", opacity: prev ? 1 : 0.4 }}>{isAr ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</button>
                  <button onClick={() => { if (next) { setDrawerAlert(next); mapInstance.current?.flyTo({ center: [next.lng, next.lat], zoom: 13.5, speed: 1.2 }); } }} disabled={!next} className="w-8 h-8 flex items-center justify-center rounded-lg text-[10px]" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: next ? "var(--text)" : "var(--text-muted)", cursor: next ? "pointer" : "default", opacity: next ? 1 : 0.4 }}>{isAr ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}</button>
                </>); })()}
              </div>
            </div>
            {/* Detail body */}
            <div className="flex-1 overflow-y-auto">
              {/* Alert card */}
              <div className="p-5 relative" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className={`absolute ${isAr ? "right-0" : "left-0"} top-0 bottom-0 w-[4px]`} style={{ backgroundColor: TYPE_COLORS[drawerAlert.type] || "#5BA4E6" }} />
                <div className={isAr ? "pr-3" : "pl-3"}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-md" style={{ background: `${TYPE_COLORS[drawerAlert.type] || "#5BA4E6"}15`, color: TYPE_COLORS[drawerAlert.type] || "#5BA4E6" }}>
                      {isAr ? cleanLabel(drawerAlert.type_label) : (TYPE_LABELS_EN[drawerAlert.type] || cleanLabel(drawerAlert.type_label))}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{getTimeAgo(drawerAlert.created_at, isAr)} · {drawerAlert.created_at ? new Date(drawerAlert.created_at).toLocaleString(isAr ? "ar-LB" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : ""}</span>
                  </div>
                  <h2 className="text-lg font-extrabold mb-1">{cleanLabel(drawerAlert.type_label)} — {drawerAlert.area}</h2>
                  {drawerAlert.description && <p className="text-xs leading-7 mt-2" style={{ color: "var(--text-secondary)" }}>{drawerAlert.description}</p>}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: drawerAlert.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: drawerAlert.status === "active" ? "#22C55E" : "#EF4444", border: `1px solid ${drawerAlert.status === "active" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                      ● {drawerAlert.status === "active" ? (isAr ? "نشط" : "ACTIVE") : (isAr ? "منتهي" : "EXPIRED")}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      <Clock size={9} className="inline -mt-px" style={{ marginInlineEnd: "3px" }} />{getRemainingTime(drawerAlert.expires_at, isAr)}
                    </span>
                  </div>
                </div>
              </div>
              {/* Image */}
              {drawerAlert.image_url && <img src={drawerAlert.image_url} className="w-full" style={{ maxHeight: "200px", objectFit: "cover" }} />}
              {/* Info rows */}
              <div style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{isAr ? "النوع" : "Type"}</span>
                  <span className="text-xs font-bold">{isAr ? cleanLabel(drawerAlert.type_label) : (TYPE_LABELS_EN[drawerAlert.type] || cleanLabel(drawerAlert.type_label))}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{isAr ? "الوقت" : "Time"}</span>
                  <span className="text-xs font-bold" dir="ltr">{drawerAlert.created_at ? new Date(drawerAlert.created_at).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"} · {drawerAlert.created_at ? new Date(drawerAlert.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}</span>
                </div>
                {drawerAlert.radius && (
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{isAr ? "النطاق" : "Radius"}</span>
                    <span className="text-xs font-bold font-mono" dir="ltr">{drawerAlert.radius >= 1000 ? `${(drawerAlert.radius / 1000).toFixed(1)}km` : `${drawerAlert.radius}m`}</span>
                  </div>
                )}
              </div>
              {/* Coordinates */}
              <div className="px-5 pt-2 pb-1">
                <p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--text-muted)", textAlign: isAr ? "left" : "right" }}>{isAr ? "الإحداثيات" : "Coordinates"}</p>
              </div>
              <div style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Latitude</span>
                  <span className="text-xs font-mono font-bold" dir="ltr">{drawerAlert.lat.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Longitude</span>
                  <span className="text-xs font-mono font-bold" dir="ltr">{drawerAlert.lng.toFixed(6)}</span>
                </div>
              </div>
              {/* Related alerts */}
              {(() => {
                const related = visibleAlerts.filter(a => a.id !== drawerAlert.id && a.area === drawerAlert.area).slice(0, 3);
                if (related.length === 0) return null;
                return (
                  <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-bold tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>{isAr ? "أحداث أخرى في المنطقة" : "Other alerts nearby"}</p>
                    <div className="space-y-2">
                      {related.map(r => (
                        <button key={r.id} onClick={() => { setDrawerAlert(r); mapInstance.current?.flyTo({ center: [r.lng, r.lat], zoom: 13.5 }); }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg text-xs" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", textAlign: isAr ? "right" : "left" }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[r.type] || "#5BA4E6" }} />
                          <span className="font-bold flex-1 truncate">{r.area}</span>
                          <span style={{ color: "var(--text-muted)" }}>{r.created_at ? new Date(r.created_at).toLocaleTimeString(isAr ? "ar-LB" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : ""}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Share button */}
            <div className="flex-shrink-0 p-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => {
                const url = `${SITE_URL}/?alert=${drawerAlert.id}`;
                if (navigator.share) navigator.share({ title: drawerAlert.area, url }).catch(() => {});
                else navigator.clipboard.writeText(url);
              }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold" style={{ background: "var(--accent)", color: "white" }}>
                <Share2 size={14} /> {isAr ? "مشاركة التنبيه" : "Share Alert"}
              </button>
            </div>
          </div>
        )}

        {/* Support bottom sheet — 75% screen from bottom */}
        {showSupportPopup && (
          <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowSupportPopup(false); try { localStorage.setItem("albayan-support-dismissed", "true"); } catch {} } }}>
            <div className="absolute bottom-0 left-0 right-0 animate-slide-up" style={{ height: "75vh", background: "var(--bg-surface)", borderRadius: "20px 20px 0 0", border: "1px solid var(--border)", borderBottom: "none", boxShadow: "0 -10px 40px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" as const }}>
              {/* Handle bar */}
              <div className="w-10 h-1 rounded-full mx-auto mt-3 flex-shrink-0" style={{ background: "var(--border)" }} />
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-base font-extrabold">{isAr ? "ادعم البيان الإخباري" : "Support AlBayan News"}</h3>
                <button onClick={() => { setShowSupportPopup(false); try { localStorage.setItem("albayan-support-dismissed", "true"); } catch {} }}
                  className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px" }}>
                  <XIcon size={14} />
                </button>
              </div>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                  {isAr ? "هذه المنصة مجانية بالكامل وبدون أي إعلانات. مساهمتك المالية تساعدنا على تغطية تكاليف التشغيل والاستمرار في تقديم تنبيهات دقيقة وسريعة." : "This platform is completely free with zero ads. Your financial contribution helps us cover operating costs and continue delivering accurate, fast alerts."}
                </p>
                {/* Wish Money */}
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                    <span className="text-[11px] font-extrabold tracking-widest" style={{ color: "var(--text-muted)" }}>WISH MONEY</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>{isAr ? "متاح" : "Active"}</span>
                  </div>
                  <div className="p-4" style={{ background: "var(--bg-card)" }}>
                    <div className="flex items-start gap-4">
                      <img src="data:image/png;base64,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" alt="QR Code" className="w-28 h-auto rounded-lg flex-shrink-0" style={{ background: "white", padding: "4px" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>{isAr ? "رقم التحويل" : "Transfer Number"}</p>
                        <div className="text-lg font-extrabold tracking-wide mb-3" dir="ltr">+961 76 096 674</div>
                        <button onClick={() => { navigator.clipboard.writeText("+96176096674"); }}
                          className="text-[11px] font-bold px-4 py-2 rounded-lg" style={{ background: "rgba(91,164,230,0.08)", color: "#5BA4E6", border: "1px solid rgba(91,164,230,0.18)", cursor: "pointer", fontFamily: "inherit" }}>
                          {isAr ? "نسخ الرقم" : "Copy Number"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* OMT */}
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                    <span className="text-[11px] font-extrabold tracking-widest" style={{ color: "var(--text-muted)" }}>OMT</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>{isAr ? "متاح" : "Active"}</span>
                  </div>
                  <div className="px-4 py-4" style={{ background: "var(--bg-card)" }}>
                    <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>{isAr ? "تحويل عبر أي فرع OMT باسم" : "Transfer via any OMT branch to"}</p>
                    <div className="text-lg font-extrabold mt-1">Mohamad Abed Ali</div>
                  </div>
                </div>
                {/* USDT */}
                <div className="rounded-xl px-4 py-3.5 flex items-center justify-between" style={{ background: "var(--bg-card)", border: "1px dashed var(--border)" }}>
                  <span className="text-[11px] font-extrabold tracking-widest" style={{ color: "var(--text-muted)" }}>USDT (TRC20)</span>
                  <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>{isAr ? "قريبا" : "Coming soon"}</span>
                </div>
              </div>
              {/* Bottom CTA */}
              <div className="flex-shrink-0 px-5 py-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                <a href="/donate" className="w-full flex items-center justify-center py-3.5 rounded-xl text-sm font-extrabold" style={{ background: "var(--accent)", color: "white" }}>
                  {isAr ? "صفحة التبرع الكاملة" : "Full Donation Page"}
                </a>
                <button onClick={() => { setShowSupportPopup(false); try { localStorage.setItem("albayan-support-dismissed", "true"); } catch {} }}
                  className="w-full text-center py-2 text-[11px] font-bold" style={{ color: "var(--text-muted)", cursor: "pointer", background: "transparent", border: "none", fontFamily: "inherit" }}>
                  {isAr ? "ليس الآن" : "Not now"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center h-8 text-[10px]"
          style={{ background: "var(--bg-surface)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
          <span>{t("siteName")} — {t("liveMap")}</span>
          <span className="mx-2">|</span>
          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500" />{t("live")}</span>
          <span className="mx-2">|</span>
          <Link href="/history" className="hover:underline">{isAr ? "سجل" : "History"}</Link>
          <span className="mx-2">|</span>
          <Link href="/stats" className="hover:underline">{isAr ? "إحصائيات" : "Stats"}</Link>
        </div>
      </div>

      {/* ─── GUIDED TOUR ────────────────────────────────── */}
      {tourStep >= 0 && tourStep < TOUR_STEPS.length && (() => {
        const step = TOUR_STEPS[tourStep];
        const isCentered = step.pos === "center" || (!tourRect && step.pos !== "bottom");
        const isBottom = step.pos === "bottom";
        const pad = 12;

        // Calculate tooltip position
        let tooltipStyle: React.CSSProperties = {};
        if (isBottom) {
          tooltipStyle = { position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 110 };
        } else if (!isCentered && tourRect) {
          const cx = tourRect.left + tourRect.width / 2;
          const cy = tourRect.top + tourRect.height / 2;
          if (step.pos === "below") {
            tooltipStyle = { position: "fixed", top: tourRect.bottom + pad, left: Math.max(12, Math.min(cx - 170, window.innerWidth - 352)), zIndex: 110 };
          } else if (step.pos === "above") {
            tooltipStyle = { position: "fixed", bottom: window.innerHeight - tourRect.top + pad, left: Math.max(12, Math.min(cx - 170, window.innerWidth - 352)), zIndex: 110 };
          } else if (step.pos === "left") {
            tooltipStyle = { position: "fixed", top: Math.max(12, cy - 60), right: window.innerWidth - tourRect.left + pad, zIndex: 110 };
          } else if (step.pos === "right") {
            tooltipStyle = { position: "fixed", top: Math.max(12, cy - 60), left: tourRect.right + pad, zIndex: 110 };
          }
        }

        return (
          <div className="fixed inset-0 z-[100]" onClick={(e) => { if (e.target === e.currentTarget) { finishTour(); } }}>
            {/* Dark overlay with cutout for target element */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
              <defs>
                <mask id="tour-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {tourRect && (
                    <rect x={tourRect.left - 6} y={tourRect.top - 6} width={tourRect.width + 12} height={tourRect.height + 12} rx="12" fill="black" />
                  )}
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#tour-mask)" />
            </svg>

            {/* Pulsing highlight ring around target */}
            {tourRect && (
              <div className="fixed pointer-events-none" style={{ top: tourRect.top - 6, left: tourRect.left - 6, width: tourRect.width + 12, height: tourRect.height + 12, border: "2px solid var(--accent)", borderRadius: "12px", boxShadow: "0 0 0 4px rgba(229,57,53,0.2)", animation: "pulse 2s infinite", zIndex: 105 }} />
            )}

            {/* Tooltip card */}
            <div dir={isAr ? "rtl" : "ltr"} style={isCentered ? { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 110 } : tooltipStyle}>
              <div className="w-[340px] max-w-[calc(100vw-24px)] rounded-2xl overflow-hidden" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
                {/* Red accent bar */}
                <div className="h-1" style={{ background: "var(--accent)" }} />
                <div className="p-5">
                  <h3 className="text-base font-extrabold mb-2">{step.title}</h3>
                  <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{step.desc}</p>
                </div>
                <div className="flex items-center justify-between px-5 pb-4">
                  <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>{tourStep + 1} / {TOUR_STEPS.length}</span>
                  <div className="flex gap-2">
                    {tourStep > 0 && (
                      <button onClick={() => setTourStep(s => s - 1)}
                        className="text-xs font-bold px-4 py-2 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", fontFamily: "inherit" }}>
                        {isAr ? "السابق" : "Back"}
                      </button>
                    )}
                    <button onClick={() => { tourStep === TOUR_STEPS.length - 1 ? finishTour() : setTourStep(s => s + 1); }}
                      className="text-xs font-bold px-5 py-2 rounded-lg text-white" style={{ background: "var(--accent)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      {tourStep === TOUR_STEPS.length - 1 ? (isAr ? "ابدأ الاستخدام" : "Get Started") : (isAr ? "التالي" : "Next")}
                    </button>
                  </div>
                </div>
              </div>
              {/* Skip link */}
              {tourStep < TOUR_STEPS.length - 1 && (
                <div className="text-center mt-3">
                  <button onClick={finishTour} className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    {isAr ? "تخطي الجولة" : "Skip tour"}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </main>
  );
}