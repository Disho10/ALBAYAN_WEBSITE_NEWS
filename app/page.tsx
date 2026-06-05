"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Settings } from "lucide-react";

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

const TELEGRAM_CHANNEL_URL = "https://t.me/AlBayan_Newss";
const WHATSAPP_URL = "https://wa.me/96176096674";

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
        Math.cos(latRad) *
          Math.sin(radiusInMeters / earthRadius) *
          Math.cos(angle)
    );

    const newLng =
      lngRad +
      Math.atan2(
        Math.sin(angle) *
          Math.sin(radiusInMeters / earthRadius) *
          Math.cos(latRad),
        Math.cos(radiusInMeters / earthRadius) -
          Math.sin(latRad) * Math.sin(newLat)
      );

    coords.push([(newLng * 180) / Math.PI, (newLat * 180) / Math.PI]);
  }

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
    properties: {},
  };
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
  if (filter === "strikes") {
    return alert.type === "strike" || alert.type === "artillery";
  }
  return alert.type === filter;
}

function createAlertPopupHTML(alert: AlertItem) {
  const remaining = getRemainingTime(alert.expiresAt);

  return `
    <div dir="rtl" style="
      width: 260px;
      background: #021B3A;
      color: white;
      border: 1px solid #134B78;
      border-radius: 22px;
      overflow: hidden;
      font-family: Arial, sans-serif;
      box-shadow: 0 20px 45px rgba(0,0,0,0.45);
    ">
      <div style="height: 6px; background: ${alert.color};"></div>

      <div style="padding: 14px;">
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          margin-bottom:14px;
        ">
          <span style="
            background:${alert.color}22;
            color:${alert.color};
            border:1px solid ${alert.color}66;
            padding:4px 10px;
            border-radius:999px;
            font-size:12px;
            font-weight:900;
          ">
            ${alert.typeLabel}
          </span>

          <span style="
            color:#94A3B8;
            font-size:12px;
            font-weight:700;
          ">
            AlBayan Alert
          </span>
        </div>

        <h3 style="
          margin:0;
          font-size:20px;
          font-weight:900;
          line-height:1.4;
        ">
          ${alert.area}
        </h3>

        <p style="
          margin:10px 0 0;
          color:#CBD5E1;
          font-size:14px;
          line-height:1.8;
        ">
          ${alert.description || "لا توجد تفاصيل إضافية لهذا الحدث حاليًا."}
        </p>

        <div style="
          margin-top:16px;
          background:#00152D;
          border:1px solid #134B78;
          border-radius:14px;
          padding:10px;
        ">
          <div style="
            color:#94A3B8;
            font-size:12px;
            margin-bottom:4px;
          ">
            مدة الظهور
          </div>

          <div style="
            color:#FACC15;
            font-weight:900;
            font-size:14px;
          ">
            ⏳ ينتهي بعد: ${remaining}
          </div>
        </div>

        <a
          href="${TELEGRAM_CHANNEL_URL}"
          target="_blank"
          style="
            display:block;
            margin-top:16px;
            text-align:center;
            background:#3B82F6;
            color:white;
            text-decoration:none;
            font-weight:900;
            padding:10px;
            border-radius:14px;
            font-size:14px;
          "
        >
          الدخول إلى قناة التلغرام
        </a>
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

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mapReady, setMapReady] = useState(false);
  const [, forceUpdate] = useState(0);

  const visibleAlerts = useMemo(() => {
    return alerts.filter((alert) => matchesFilter(alert, activeFilter));
  }, [alerts, activeFilter]);

  const urgentAlerts = useMemo(() => {
    return alerts.filter((a) => a.isUrgent);
  }, [alerts]);

  function loadActiveAlerts() {
    const savedAlerts = JSON.parse(localStorage.getItem("alerts") || "[]");

    const activeAlerts = savedAlerts.filter((alert: AlertItem) => {
      const isActive = alert.status !== "hidden";
      const isNotExpired =
        !alert.expiresAt || new Date(alert.expiresAt).getTime() > Date.now();

      return isActive && isNotExpired;
    });

    setAlerts(activeAlerts);
  }

  function showAlertPopup(alert: AlertItem, lngLat: maplibregl.LngLatLike) {
    const map = mapInstance.current;
    if (!map) return;

    if (activePopupRef.current) {
      activePopupRef.current.remove();
    }

    activePopupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 18,
    })
      .setLngLat(lngLat)
      .setHTML(createAlertPopupHTML(alert))
      .addTo(map);
  }

  function openAlert(alert: AlertItem) {
    const map = mapInstance.current;
    if (!map) return;

    map.flyTo({
      center: [alert.lng, alert.lat],
      zoom: 13.5,
      speed: 1.2,
    });

    showAlertPopup(alert, [alert.lng, alert.lat]);
  }

  useEffect(() => {
    loadActiveAlerts();
    window.addEventListener("storage", loadActiveAlerts);

    return () => {
      window.removeEventListener("storage", loadActiveAlerts);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      loadActiveAlerts();
      forceUpdate((v) => v + 1);
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    try {
      maplibregl.setRTLTextPlugin(
        "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js",
        true
      );
    } catch {}

    const map = new maplibregl.Map({
      container: mapRef.current,
      style:
        "https://api.maptiler.com/maps/019e938b-1724-7c83-bc08-c349163f4757/style.json?key=YDccEq4jbWZM56b17fsr",
      center: [35.22, 33.27],
      zoom: 11,
      minZoom: 8,
      maxZoom: 15,
    });

    mapInstance.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-left");

    map.on("load", async () => {
      const res = await fetch("/data/lbn_admin3.geojson");
      const admin3 = await res.json();

      if (!map.getSource("admin3")) {
        map.addSource("admin3", {
          type: "geojson",
          data: admin3,
        });
      }

      setMapReady(true);
    });

    return () => map.remove();
  }, []);

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
      const isStrike =
        alert.type === "strike" ||
        alert.type === "artillery" ||
        alert.typeLabel?.includes("غارة") ||
        alert.typeLabel?.includes("مدفعي");

      if (isStrike) {
        const sameAreaIndex = visibleAlerts
          .filter(
            (item) =>
              (item.type === "strike" ||
                item.type === "artillery" ||
                item.typeLabel?.includes("غارة") ||
                item.typeLabel?.includes("مدفعي")) &&
              item.area === alert.area
          )
          .findIndex((item) => item.id === alert.id);

        const offset = 0.0035;
        const positions = [
          [0, 0],
          [offset, 0],
          [-offset, 0],
          [0, offset],
          [0, -offset],
          [offset, offset],
          [-offset, -offset],
          [offset, -offset],
          [-offset, offset],
        ];

        const pos = positions[sameAreaIndex % positions.length];
        const markerLng = alert.lng + pos[0];
        const markerLat = alert.lat + pos[1];

        const el = document.createElement("div");
        el.style.width = "22px";
        el.style.height = "22px";
        el.style.background =
          alert.type === "artillery" ? "#DC2626" : "#ef4444";
        el.style.border = "3px solid white";
        el.style.borderRadius = "50%";
        el.style.boxShadow = "0 0 18px rgba(239,68,68,1)";
        el.style.cursor = "pointer";

        el.addEventListener("click", (event) => {
          event.stopPropagation();
          showAlertPopup(alert, [markerLng, markerLat]);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([markerLng, markerLat])
          .addTo(map);

        strikeMarkersRef.current.push(marker);
        return;
      }

      if (
        alert.type === "threat" ||
        alert.type === "enemy_position" ||
        alert.type === "army_position"
      ) {
        const areaLayerId = `area-${alert.id}`;
        const areaLineId = `area-line-${alert.id}`;

        const color =
          alert.type === "threat"
            ? "#F59E0B"
            : alert.type === "enemy_position"
            ? "#A855F7"
            : "#22C55E";

        map.addLayer({
          id: areaLayerId,
          type: "fill",
          source: "admin3",
          paint: {
            "fill-color": color,
            "fill-opacity": 0.45,
          },
          filter: ["==", ["get", "adm3_name1"], alert.area],
        });

        map.addLayer({
          id: areaLineId,
          type: "line",
          source: "admin3",
          paint: {
            "line-color": color,
            "line-width": 3,
          },
          filter: ["==", ["get", "adm3_name1"], alert.area],
        });

        const clickHandler = (e: maplibregl.MapLayerMouseEvent) => {
          showAlertPopup(alert, e.lngLat);
        };

        const mouseEnterHandler = () => {
          map.getCanvas().style.cursor = "pointer";
        };

        const mouseLeaveHandler = () => {
          map.getCanvas().style.cursor = "";
        };

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

      const circleData = createCircleGeoJSON(
        alert.lng,
        alert.lat,
        alert.radius || 800
      );

      map.addSource(sourceId, {
        type: "geojson",
        data: circleData as any,
      });

      activeSourceIdsRef.current.push(sourceId);

      map.addLayer({
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": alert.color || "#1E5EFF",
          "fill-opacity": 0.28,
        },
      });

      map.addLayer({
        id: lineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": alert.color || "#4E7DFF",
          "line-width": 2,
        },
      });

      const clickHandler = (e: maplibregl.MapLayerMouseEvent) => {
        showAlertPopup(alert, e.lngLat);
      };

      const mouseEnterHandler = () => {
        map.getCanvas().style.cursor = "pointer";
      };

      const mouseLeaveHandler = () => {
        map.getCanvas().style.cursor = "";
      };

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
  }, [visibleAlerts, mapReady]);

  return (
    <main className="h-screen bg-[#00152D] text-white">
      <header className="h-20 flex items-center justify-between px-6 border-b border-[#134B78] bg-[#021B3A]/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0A3563] border border-[#134B78] flex items-center justify-center shadow-inner">
            <span className="text-xl">🗺️</span>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-[#3B82F6] leading-tight">
              AlBayan Alert Map
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time field alerts across Lebanon
            </p>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2 rounded-2xl border border-[#134B78] bg-[#001F3F]/80 px-4 py-2 text-sm">
          <div className="flex items-center gap-2 text-green-300">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-bold">System Operational</span>
          </div>

          <span className="text-slate-600">|</span>

          <div className="text-slate-300">📍 Lebanon Coverage</div>

          <span className="text-slate-600">|</span>

          <div className="text-slate-300">⚡ Real-Time Updates</div>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <a
            href="/settings"
            className="w-10 h-10 flex items-center justify-center bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] rounded-xl transition"
            title="Settings"
          >
            <Settings size={18} />
          </a>

          <a
            href={TELEGRAM_CHANNEL_URL}
            target="_blank"
            className="h-10 flex items-center gap-2 bg-[#0A3563] hover:bg-[#134B78] border border-[#134B78] transition rounded-xl px-3 text-sm font-bold"
          >
            Telegram
          </a>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            className="h-10 flex items-center gap-2 bg-green-600 hover:bg-green-700 transition rounded-xl px-3 text-sm font-bold"
          >
            WhatsApp
          </a>

          <a
            href="/donate"
            className="h-10 flex items-center gap-2 bg-white hover:bg-slate-200 text-[#00152D] transition rounded-xl px-3 text-sm font-extrabold"
          >
            ♡ Donate
          </a>

          <a
            href="/report"
            className="h-10 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition rounded-xl px-3 text-sm font-extrabold"
          >
            ⚠ Report
          </a>
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <a
            href="/report"
            className="bg-orange-500 hover:bg-orange-600 transition rounded-lg px-3 py-2 text-sm font-bold"
          >
            Report
          </a>
        </div>
      </header>

      <div className="relative h-[calc(100vh-80px)] w-full">
        {urgentAlerts.length > 0 && (
          <div
            className="absolute top-0 left-0 right-0 z-30 bg-red-700 text-white h-12 flex items-center justify-center shadow-lg"
            dir="rtl"
          >
            {urgentAlerts.slice(0, 1).map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-center gap-3"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>

              <span className="font-black text-lg tracking-wide">
                عاجل
              </span>

              <span className="font-bold">
                {alert.typeLabel} - {alert.area}
              </span>
            </div>
            ))}
          </div>
        )}

        <div
          className={`absolute left-1/2 -translate-x-1/2 z-20 flex gap-2 rounded-xl border border-[#134B78] bg-[#021B3A]/95 px-3 py-2 ${
            urgentAlerts.length > 0 ? "top-16" : "top-4"
          }`}
          dir="rtl"
        >
          {[
            { value: "all", label: "الكل" },
            { value: "strikes", label: "غارات / مدفعي" },
            { value: "drone", label: "مسيّرات" },
            { value: "threat", label: "تهديدات" },
            { value: "enemy_position", label: "تمركز العدو" },
            { value: "army_position", label: "الجيش" },
            { value: "traffic", label: "حوادث" },
            { value: "crowd", label: "اشتباكات" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveFilter(item.value)}
              className={`px-3 py-1 rounded text-sm ${
                activeFilter === item.value
                  ? "bg-[#1E5EFF]"
                  : "bg-[#0A3563] hover:bg-[#134B78]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div ref={mapRef} className="h-full w-full" />

        <div
          className="absolute bottom-4 left-4 z-20 w-64 rounded-xl border border-[#134B78] bg-[#021B3A]/95 p-4 shadow-lg"
          dir="rtl"
        >
          <h3 className="font-bold mb-3 text-[#3B82F6]">مفتاح الخريطة</h3>

          <div className="space-y-2 text-sm">

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#EF4444]" />
              <span>غارة / قصف مدفعي</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#F59E0B]" />
              <span>تهديد</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#A855F7]" />
              <span>تمركز العدو</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#22C55E]" />
              <span>انتشار الجيش اللبناني</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#38BDF8]" />
              <span>حادث سير</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#EF4444]" />
              <span>اشتباكات</span>
            </div>
          </div>
        </div>

        <aside
          className={`absolute right-4 z-10 w-80 overflow-y-auto rounded-xl border border-[#134B78] bg-[#021B3A]/95 p-4 ${
            urgentAlerts.length > 0
              ? "top-20 max-h-[calc(100vh-180px)]"
              : "top-4 max-h-[85vh]"
          }`}
          dir="rtl"
        >
          <h2 className="text-lg font-bold mb-4">الأحداث المباشرة</h2>

          {visibleAlerts.length === 0 ? (
            <p className="text-sm text-slate-300">لا توجد أحداث حاليًا</p>
          ) : (
            <div className="space-y-3">
              {visibleAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => openAlert(alert)}
                  className="w-full text-right rounded-lg bg-[#0A3563] hover:bg-[#134B78] p-3 border border-[#134B78]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold">{alert.typeLabel}</span>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: alert.color }}
                    />
                  </div>

                  <div className="text-sm text-slate-200 mt-1">
                    {alert.area}
                  </div>

                  {alert.description && (
                    <div className="text-xs text-slate-300 mt-2 line-clamp-2">
                      {alert.description}
                    </div>
                  )}

                  <div className="text-xs text-orange-300 mt-2">
                    ⏳ ينتهي بعد: {getRemainingTime(alert.expiresAt)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
