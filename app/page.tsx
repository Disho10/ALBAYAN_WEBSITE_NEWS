"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Settings, Menu, X, LocateFixed } from "lucide-react";
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
  soundEnabled: true,
  urgentBar: true,
  highlightAreas: true,
  selectedArea: "صور",
  enabledAlertTypes: [],
};

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem("albayan-settings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function createCircleGeoJSON(lng: number, lat: number, radiusInMeters: number) {
  const points = 64;
  const coords = [];
  const earthRadius = 6371000;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const newLat = Math.asin(
      Math.sin(latRad) * Math.cos(radiusInMeters / earthRadius) +
        Math.cos(latRad) * Math.sin(radiusInMeters / earthRadius) * Math.cos(angle)
    );
    const newLng =
      lngRad +
      Math.atan2(
        Math.sin(angle) * Math.sin(radiusInMeters / earthRadius) * Math.cos(latRad),
        Math.cos(radiusInMeters / earthRadius) - Math.sin(latRad) * Math.sin(newLat)
      );
    coords.push([(newLng * 180) / Math.PI, (newLat * 180) / Math.PI]);
  }
  return { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: {} };
}

function getRemainingTime(expiresAt?: string | null) {
  if (!expiresAt) return "دائم";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "انتهى";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "أقل من دقيقة";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} ساعة`;
  return `${hours} ساعة و ${remainingMinutes} دقيقة`;
}

function matchesFilter(alert: AlertItem, filter: string) {
  if (filter === "all") return true;
  if (filter === "strikes") return alert.type === "strike" || alert.type === "artillery";
  return alert.type === filter;
}

function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.value = 0.15;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.stop(ctx.currentTime + 0.6);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      osc2.type = "sine";
      gain2.gain.value = 0.15;
      osc2.start();
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      osc2.stop(ctx.currentTime + 1);
    }, 200);
  } catch {}
}

function createAlertPopupHTML(alert: AlertItem) {
  const remaining = getRemainingTime(alert.expires_at);
  return `
    <div dir="rtl" style="width:260px;background:#021B3A;color:white;border:1px solid #134B78;border-radius:22px;overflow:hidden;font-family:Arial,sans-serif;box-shadow:0 20px 45px rgba(0,0,0,0.45);">
      <div style="height:6px;background:${alert.color};"></div>
      <div style="padding:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;">
          <span style="background:${alert.color}22;color:${alert.color};border:1px solid ${alert.color}66;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:900;">${alert.type_label}</span>
          <span style="color:#94A3B8;font-size:12px;font-weight:700;">AlBayan Alert</span>
        </div>
        <h3 style="margin:0;font-size:20px;font-weight:900;line-height:1.4;">${alert.area}</h3>
        <p style="margin:10px 0 0;color:#CBD5E1;font-size:14px;line-height:1.8;">${alert.description || "لا توجد تفاصيل إضافية لهذا الحدث حاليًا."}</p>
        <div style="margin-top:16px;background:#00152D;border:1px solid #134B78;border-radius:14px;padding:10px;">
          <div style="color:#94A3B8;font-size:12px;margin-bottom:4px;">مدة الظهور</div>
          <div style="color:#FACC15;font-weight:900;font-size:14px;">⏳ ينتهي بعد: ${remaining}</div>
        </div>
        <a href="${TELEGRAM_CHANNEL_URL}" target="_blank" rel="noopener noreferrer" style="display:block;margin-top:16px;text-align:center;background:#3B82F6;color:white;text-decoration:none;font-weight:900;padding:10px;border-radius:14px;font-size:14px;">الدخول إلى قناة التلغرام</a>
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
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [, forceUpdate] = useState(0);

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => matchesFilter(alert, activeFilter)),
    [alerts, activeFilter]
  );

  const urgentAlerts = useMemo(
    () => alerts.filter((a) => a.is_urgent),
    [alerts]
  );

  useEffect(() => {
    setUserSettings(loadSettings());
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("alerts")
        .select("*")
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const newAlerts = data || [];

      // Check for new urgent alerts and play sound
      if (userSettings.soundEnabled) {
        const newIds = new Set(newAlerts.map((a) => a.id));
        const prevIds = prevAlertIdsRef.current;
        for (const alert of newAlerts) {
          if (alert.is_urgent && !prevIds.has(alert.id)) {
            playAlertSound();
            break;
          }
        }
        prevAlertIdsRef.current = newIds;
      }

      setAlerts(newAlerts);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to load alerts:", message);
      setError("تعذر تحميل التنبيهات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, [userSettings.soundEnabled]);

  function showAlertPopup(alert: AlertItem, lngLat: maplibregl.LngLatLike) {
    const map = mapInstance.current;
    if (!map) return;
    if (activePopupRef.current) activePopupRef.current.remove();
    activePopupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 18 })
      .setLngLat(lngLat)
      .setHTML(createAlertPopupHTML(alert))
      .addTo(map);
  }

  function openAlert(alert: AlertItem) {
    const map = mapInstance.current;
    if (!map) return;
    map.flyTo({ center: [alert.lng, alert.lat], zoom: 13.5, speed: 1.2 });
    showAlertPopup(alert, [alert.lng, alert.lat]);
  }

  function locateUser() {
    const map = mapInstance.current;
    if (!map) return;
    if (!navigator.geolocation) {
      alert("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        map.flyTo({ center: [longitude, latitude], zoom: 13, speed: 1.4 });
        if (userMarkerRef.current) userMarkerRef.current.remove();
        const el = document.createElement("div");
        el.style.width = "18px";
        el.style.height = "18px";
        el.style.background = "#3B82F6";
        el.style.border = "3px solid white";
        el.style.borderRadius = "50%";
        el.style.boxShadow = "0 0 0 6px rgba(59,130,246,0.3), 0 0 12px rgba(59,130,246,0.5)";
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map);
      },
      () => {
        alert("تعذر تحديد موقعك. تأكد من تفعيل خدمات الموقع.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // Load alerts & subscribe to real-time
  useEffect(() => {
    loadAlerts();

    const channel = supabase
      .channel("alerts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        loadAlerts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadAlerts]);

  // Refresh expiry timers
  useEffect(() => {
    const timer = setInterval(() => {
      loadAlerts();
      forceUpdate((v) => v + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, [loadAlerts]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const rtlStatus = maplibregl.getRTLTextPluginStatus();
    if (rtlStatus === "unavailable") {
      maplibregl.setRTLTextPlugin(
        "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js",
        true
      );
    }

    const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/019e938b-1724-7c83-bc08-c349163f4757/style.json?key=${maptilerKey}`,
      center: [35.22, 33.27],
      zoom: 11,
      minZoom: 8,
      maxZoom: 15,
    });

    mapInstance.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-left");

    map.on("load", async () => {
      try {
        const res = await fetch("/data/lbn_admin3.geojson");
        if (!res.ok) throw new Error("Failed to load GeoJSON");
        const admin3 = await res.json();
        if (!map.getSource("admin3")) {
          map.addSource("admin3", { type: "geojson", data: admin3 });
        }
      } catch (err) {
        console.error("GeoJSON load error:", err);
      }
      setMapReady(true);
    });

    map.on("error", (e) => console.error("Map error:", e));

    return () => map.remove();
  }, []);

  // Render alerts on map
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady || !map.isStyleLoaded()) return;

    cleanupHandlersRef.current.forEach((cleanup) => cleanup());
    cleanupHandlersRef.current = [];
    strikeMarkersRef.current.forEach((marker) => marker.remove());
    strikeMarkersRef.current = [];
    activeLayerIdsRef.current.forEach((layerId) => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    });
    activeLayerIdsRef.current = [];
    activeSourceIdsRef.current.forEach((sourceId) => {
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });
    activeSourceIdsRef.current = [];

    visibleAlerts.forEach((alert) => {
      const isStrike = alert.type === "strike" || alert.type === "artillery";
      const isAreaHighlight = alert.type === "threat" || alert.type === "enemy_position" || alert.type === "army_position";

      if (isStrike) {
        const sameAreaAlerts = visibleAlerts.filter((a) => (a.type === "strike" || a.type === "artillery") && a.area === alert.area);
        const sameAreaIndex = sameAreaAlerts.findIndex((a) => a.id === alert.id);
        const offset = 0.0035;
        const positions = [[0,0],[offset,0],[-offset,0],[0,offset],[0,-offset],[offset,offset],[-offset,-offset],[offset,-offset],[-offset,offset]];
        const pos = positions[sameAreaIndex % positions.length];
        const markerLng = alert.lng + pos[0];
        const markerLat = alert.lat + pos[1];

        const el = document.createElement("div");
        el.className = "strike-marker";
        el.style.background = alert.type === "artillery" ? "#DC2626" : "#ef4444";

        el.addEventListener("click", (event) => {
          event.stopPropagation();
          showAlertPopup(alert, [markerLng, markerLat]);
        });

        const marker = new maplibregl.Marker({ element: el }).setLngLat([markerLng, markerLat]).addTo(map);
        strikeMarkersRef.current.push(marker);
        return;
      }

      if (isAreaHighlight && userSettings.highlightAreas) {
        const areaLayerId = `area-${alert.id}`;
        const areaLineId = `area-line-${alert.id}`;
        const color = alert.type === "threat" ? "#F59E0B" : alert.type === "enemy_position" ? "#A855F7" : "#22C55E";

        map.addLayer({ id: areaLayerId, type: "fill", source: "admin3", paint: { "fill-color": color, "fill-opacity": 0.45 }, filter: ["==", ["get", "adm3_name1"], alert.area] });
        map.addLayer({ id: areaLineId, type: "line", source: "admin3", paint: { "line-color": color, "line-width": 3 }, filter: ["==", ["get", "adm3_name1"], alert.area] });

        const clickHandler = (e: maplibregl.MapLayerMouseEvent) => showAlertPopup(alert, e.lngLat);
        const mouseEnterHandler = () => { map.getCanvas().style.cursor = "pointer"; };
        const mouseLeaveHandler = () => { map.getCanvas().style.cursor = ""; };
        map.on("click", areaLayerId, clickHandler);
        map.on("mouseenter", areaLayerId, mouseEnterHandler);
        map.on("mouseleave", areaLayerId, mouseLeaveHandler);
        cleanupHandlersRef.current.push(() => {
          map.off("click", areaLayerId, clickHandler);
          map.off("mouseenter", areaLayerId, mouseEnterHandler);
          map.off("mouseleave", areaLayerId, mouseLeaveHandler);
        });
        activeLayerIdsRef.current.push(areaLayerId, areaLineId);
        return;
      }

      const sourceId = `alert-source-${alert.id}`;
      const fillLayerId = `alert-fill-${alert.id}`;
      const lineLayerId = `alert-line-${alert.id}`;
      const circleData = createCircleGeoJSON(alert.lng, alert.lat, alert.radius || 800);

      map.addSource(sourceId, { type: "geojson", data: circleData as any });
      activeSourceIdsRef.current.push(sourceId);
      map.addLayer({ id: fillLayerId, type: "fill", source: sourceId, paint: { "fill-color": alert.color || "#1E5EFF", "fill-opacity": 0.28 } });
      map.addLayer({ id: lineLayerId, type: "line", source: sourceId, paint: { "line-color": alert.color || "#4E7DFF", "line-width": 2 } });

      const clickHandler = (e: maplibregl.MapLayerMouseEvent) => showAlertPopup(alert, e.lngLat);
      const mouseEnterHandler = () => { map.getCanvas().style.cursor = "pointer"; };
      const mouseLeaveHandler = () => { map.getCanvas().style.cursor = ""; };
      map.on("click", fillLayerId, clickHandler);
      map.on("mouseenter", fillLayerId, mouseEnterHandler);
      map.on("mouseleave", fillLayerId, mouseLeaveHandler);
      cleanupHandlersRef.current.push(() => {
        map.off("click", fillLayerId, clickHandler);
        map.off("mouseenter", fillLayerId, mouseEnterHandler);
        map.off("mouseleave", fillLayerId, mouseLeaveHandler);
      });
      activeLayerIdsRef.current.push(fillLayerId, lineLayerId);
    });
  }, [visibleAlerts, mapReady, userSettings.highlightAreas]);

  const filterItems = [
    { value: "all", label: "الكل" },
    { value: "strikes", label: "غارات / مدفعي" },
    { value: "drone", label: "مسيّرات" },
    { value: "threat", label: "تهديدات" },
    { value: "enemy_position", label: "تمركز العدو" },
    { value: "army_position", label: "الجيش" },
    { value: "traffic", label: "حوادث" },
    { value: "crowd", label: "اشتباكات" },
  ];

  return (
    <main className="h-screen bg-[#00152D] text-white" dir="rtl">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-4 md:px-6 border-b border-[#134B78] bg-[#021B3A]/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] relative z-50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0A3563] border border-[#134B78] flex items-center justify-center shadow-inner">
            <span className="text-xl">🗺️</span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#3B82F6] leading-tight">AlBayan Alert Map</h1>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">تنبيهات ميدانية مباشرة — لبنان</p>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2 rounded-2xl border border-[#134B78] bg-[#001F3F]/80 px-4 py-2 text-sm">
          <div className="flex items-center gap-2 text-green-300">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-bold">النظام يعمل</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-slate-300">📍 تغطية لبنان</div>
          <span className="text-slate-600">|</span>
          <div className="text-slate-300">⚡ تحديثات مباشرة</div>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <Link href="/settings" className="w-10 h-10 flex items-center justify-center bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] rounded-xl transition" title="الإعدادات"><Settings size={18} /></Link>
          <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="h-10 flex items-center gap-2 bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] transition rounded-xl px-3 text-sm font-bold">تلغرام</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="h-10 flex items-center gap-2 bg-green-600 hover:bg-green-700 transition rounded-xl px-3 text-sm font-bold">واتساب</a>
          <Link href="/donate" className="h-10 flex items-center gap-2 bg-white hover:bg-slate-200 text-[#00152D] transition rounded-xl px-3 text-sm font-extrabold">♡ ادعمنا</Link>
          <Link href="/report" className="h-10 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition rounded-xl px-3 text-sm font-extrabold">⚠ بلاغ</Link>
        </nav>

        <button className="md:hidden w-10 h-10 flex items-center justify-center bg-[#0A3563] border border-[#134B78] rounded-xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {mobileMenuOpen && (
          <div className="absolute top-20 left-0 right-0 bg-[#021B3A] border-b border-[#134B78] p-4 flex flex-col gap-2 md:hidden z-50">
            <Link href="/report" onClick={() => setMobileMenuOpen(false)} className="bg-orange-500 hover:bg-orange-600 transition rounded-xl px-4 py-3 text-center font-bold">⚠ إرسال بلاغ</Link>
            <Link href="/donate" onClick={() => setMobileMenuOpen(false)} className="bg-white hover:bg-slate-200 text-[#00152D] transition rounded-xl px-4 py-3 text-center font-bold">♡ ادعمنا</Link>
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] transition rounded-xl px-4 py-3 text-center font-bold">تلغرام</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 transition rounded-xl px-4 py-3 text-center font-bold">واتساب</a>
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] transition rounded-xl px-4 py-3 text-center font-bold">⚙ الإعدادات</Link>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] transition rounded-xl px-4 py-3 text-center font-bold">الأسئلة الشائعة</Link>
          </div>
        )}
      </header>

      <div className="relative h-[calc(100vh-80px)] w-full">
        {loading && (
          <div className="absolute inset-0 z-40 bg-[#00152D] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#134B78] border-t-[#3B82F6] rounded-full animate-spin" />
            <p className="text-slate-300 font-bold">جاري تحميل الخريطة...</p>
          </div>
        )}

        {error && (
          <div className="absolute top-0 left-0 right-0 z-30 bg-red-900/90 text-white px-4 py-3 text-center text-sm font-bold">
            {error}
            <button onClick={loadAlerts} className="mr-3 underline hover:no-underline">إعادة المحاولة</button>
          </div>
        )}

        {userSettings.urgentBar && urgentAlerts.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-30 bg-red-700 text-white h-12 flex items-center justify-center shadow-lg">
            {urgentAlerts.slice(0, 1).map((alert) => (
              <div key={alert.id} className="flex items-center justify-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="font-black text-lg tracking-wide">عاجل</span>
                <span className="font-bold">{alert.type_label} - {alert.area}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`absolute left-1/2 -translate-x-1/2 z-20 flex gap-2 rounded-xl border border-[#134B78] bg-[#021B3A]/95 px-3 py-2 max-w-[calc(100vw-32px)] overflow-x-auto filter-scroll ${userSettings.urgentBar && urgentAlerts.length > 0 ? "top-16" : "top-4"}`}>
          {filterItems.map((item) => (
            <button key={item.value} onClick={() => setActiveFilter(item.value)} className={`px-3 py-1 rounded text-sm whitespace-nowrap flex-shrink-0 ${activeFilter === item.value ? "bg-[#1E5EFF]" : "bg-[#0A3563] hover:bg-[#134B78]"}`}>
              {item.label}
            </button>
          ))}
        </div>

        <div ref={mapRef} className="h-full w-full" />

        {/* Locate me button */}
        <button onClick={locateUser} className="absolute bottom-4 right-4 z-20 w-12 h-12 bg-[#021B3A]/95 hover:bg-[#134B78] border border-[#134B78] rounded-xl flex items-center justify-center transition shadow-lg" title="حدد موقعي">
          <LocateFixed size={22} className="text-[#3B82F6]" />
        </button>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 w-56 lg:w-64 rounded-xl border border-[#134B78] bg-[#021B3A]/95 p-4 shadow-lg hidden sm:block">
          <h3 className="font-bold mb-3 text-[#3B82F6]">مفتاح الخريطة</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#EF4444]" /><span>غارة / قصف مدفعي</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#F59E0B]" /><span>تهديد</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#A855F7]" /><span>تمركز العدو</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#22C55E]" /><span>انتشار الجيش اللبناني</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#38BDF8]" /><span>حادث سير</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#DC2626]" /><span>اشتباكات</span></div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={`absolute right-4 z-10 w-72 lg:w-80 overflow-y-auto rounded-xl border border-[#134B78] bg-[#021B3A]/95 p-4 hidden md:block ${userSettings.urgentBar && urgentAlerts.length > 0 ? "top-20 max-h-[calc(100vh-180px)]" : "top-4 max-h-[85vh]"}`}>
          <h2 className="text-lg font-bold mb-4">الأحداث المباشرة</h2>
          {visibleAlerts.length === 0 ? (
            <p className="text-sm text-slate-300">لا توجد أحداث حاليًا</p>
          ) : (
            <div className="space-y-3">
              {visibleAlerts.map((alert) => (
                <button key={alert.id} onClick={() => openAlert(alert)} className="w-full text-right rounded-lg bg-[#0A3563] hover:bg-[#134B78] p-3 border border-[#134B78]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold">{alert.type_label}</span>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: alert.color }} />
                  </div>
                  <div className="text-sm text-slate-200 mt-1">{alert.area}</div>
                  {alert.description && <div className="text-xs text-slate-300 mt-2 line-clamp-2">{alert.description}</div>}
                  <div className="text-xs text-orange-300 mt-2">⏳ ينتهي بعد: {getRemainingTime(alert.expires_at)}</div>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
