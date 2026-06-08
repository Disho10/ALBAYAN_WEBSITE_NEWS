import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-server";
import { readFileSync } from "fs";
import { join } from "path";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = "https://albayan-lb.com";
const TELEGRAM_CHANNEL = "https://t.me/AlBayan_Newss";
const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbApl8OBlHpfDzyrrT0f";

/* ─── Load Lebanese areas from areas.json (cached at module level) ─── */
type AreaEntry = { name: string; lat: number; lng: number };
let LB_AREAS_CACHE: Map<string, AreaEntry> | null = null;

function getLebaneseAreas(): Map<string, AreaEntry> {
  if (LB_AREAS_CACHE) return LB_AREAS_CACHE;
  try {
    const raw = readFileSync(join(process.cwd(), "public/data/areas.json"), "utf-8");
    const areas: { name: string; nameAr: string; lat: number; lng: number }[] = JSON.parse(raw);
    const map = new Map<string, AreaEntry>();
    for (const a of areas) {
      const entry = { name: a.name, lat: a.lat, lng: a.lng };
      map.set(a.name, entry);
      map.set(a.nameAr, entry);
      // Normalize: remove ال prefix, replace ی→ي, ة→ه
      const norm = a.name.replace(/^ال/, "").replace(/ی/g, "ي").replace(/ة/g, "ه").replace(/ى/g, "ي");
      map.set(norm, entry);
    }
    LB_AREAS_CACHE = map;
    return map;
  } catch { return new Map(); }
}

function findLebaneseArea(name: string): AreaEntry | null {
  const areas = getLebaneseAreas();
  const clean = name.trim().replace(/\s+/g, " ");
  // Exact
  if (areas.has(clean)) return areas.get(clean)!;
  // Without ال
  const noAl = clean.replace(/^ال/, "");
  if (areas.has(noAl)) return areas.get(noAl)!;
  // Normalize chars
  const norm = clean.replace(/ی/g, "ي").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/أ|إ|آ/g, "ا");
  if (areas.has(norm)) return areas.get(norm)!;
  const normNoAl = norm.replace(/^ال/, "");
  if (areas.has(normNoAl)) return areas.get(normNoAl)!;
  // Partial match (area name contains search or search contains area name)
  for (const [key, val] of areas) {
    if (key.length > 3 && (key.includes(clean) || clean.includes(key))) return val;
  }
  // Normalized partial
  for (const [key, val] of areas) {
    const normKey = key.replace(/ی/g, "ي").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/أ|إ|آ/g, "ا").replace(/^ال/, "");
    if (normKey.length > 3 && (normKey.includes(normNoAl) || normNoAl.includes(normKey))) return val;
  }
  return null;
}

/* ─── Israeli area mapping (for siren detection — existing) ─── */
const AREA_MAPPING: Record<string, { name: string; lat: number; lng: number }> = {
  "المطلة": { name: "المطلة", lat: 33.2778, lng: 35.5731 },
  "مطولا": { name: "المطلة", lat: 33.2778, lng: 35.5731 },
  "كريات شمونة": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "كريات شمونا": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "نهاريا": { name: "نهاريا", lat: 33.0061, lng: 35.0986 },
  "نهريا": { name: "نهاريا", lat: 33.0061, lng: 35.0986 },
  "عكا": { name: "عكا", lat: 32.928, lng: 35.0764 },
  "صفد": { name: "صفد", lat: 32.9646, lng: 35.4964 },
  "حيفا": { name: "حيفا", lat: 32.794, lng: 34.9896 },
  "شلومي": { name: "شلومي", lat: 33.0747, lng: 35.1417 },
  "مسغاف عام": { name: "مسغاف عام", lat: 33.0797, lng: 35.5244 },
  "أفيفيم": { name: "أفيفيم", lat: 33.0547, lng: 35.4022 },
  "دوفيف": { name: "دوفيف", lat: 33.0631, lng: 35.4214 },
  "يفتاح": { name: "يفتاح", lat: 33.1192, lng: 35.5008 },
  "تل أبيب": { name: "تل أبيب", lat: 32.0853, lng: 34.7818 },
  "القدس": { name: "القدس", lat: 31.7683, lng: 35.2137 },
  "بئر السبع": { name: "بئر السبع", lat: 31.2518, lng: 34.7913 },
};
const FALLBACK = { name: "جنوب لبنان", lat: 33.27, lng: 35.22 };

/* ─── Detection patterns ─── */
const IS_SIREN = [/صافرات?\s*(انذار|إنذار)/i, /red\s*alert/i, /🔴.*צבע\s*אדום/i, /צבע\s*אדום/i, /אזעקה/i, /صفارات/i, /صفارة/i, /إنذار.*صاروخ/i, /خطالمواجهة/i, /خط\s+المواجهة/i, /تسلل.*طائر/i];
const IS_END = [/הסתיים/i, /انتهى\s+الحدث/i, /الحدث\s+في.*انتهى/i, /انتهاء.*الحدث/i];
const IS_DRONE = [/طائر|مسيّر|مسير|UAV|drone|כלי\s*טיס/i];

// Avichay / IDF spokesman warning pattern
const IS_AVICHAY_WARNING = [
  /انذار\s*عاجل\s*(الى|إلى)\s*سكان\s*لبنان/i,
  /إنذار\s*عاجل\s*(الى|إلى)\s*سكان\s*لبنان/i,
  /تحذير\s*عاجل\s*(الى|إلى)\s*سكان\s*لبنان/i,
  /البلدات\s*والقرى\s*التالية/i,
  /عليكم\s*إخلاء\s*منازلكم/i,
  /المتحدث\s*باسم\s*جيش\s*الدفاع/i,
  /أفيخاي\s*أدرعي/i,
  /افيخاي\s*ادرعي/i,
];

function isAlert(text: string): boolean { return IS_SIREN.some((p) => p.test(text)); }
function isEndMessage(text: string): boolean { return IS_END.some((p) => p.test(text)); }
function isDroneAlert(text: string): boolean { return IS_DRONE.some((p) => p.test(text)); }
function isAvichayWarning(text: string): boolean { return IS_AVICHAY_WARNING.some((p) => p.test(text)); }

/* ─── Extract village names from Avichay warning ─── */
function extractAvichayVillages(text: string): string[] {
  // Pattern: "البلدات والقرى التالية: village1, village2, village3🔸"
  // Or: "المتواجدين في: village1, village2🔸"
  const patterns = [
    /التالية\s*:\s*([^🔸]+)/,
    /المتواجدين\s*في\s*:\s*([^🔸]+)/,
    /المتواجدين\s+في\s+([^🔸]+?)(?:🔸|في\s+ضوء)/,
  ];

  for (const p of patterns) {
    const match = text.match(p);
    if (match) {
      let villagesPart = match[1];
      // Remove parenthetical notes like (جزین)
      villagesPart = villagesPart.replace(/\([^)]*\)/g, "");
      // Split by comma (Arabic or Latin)
      const villages = villagesPart.split(/[,،]/)
        .map(s => s.replace(/[\u200B-\u200D\uFEFF‼️🔸🔹⚠️🚨]/g, "").trim())
        .filter(s => s.length > 1 && s.length < 30);
      return villages;
    }
  }
  return [];
}

/* ─── Extract areas from siren alerts (existing logic) ─── */
function extractSirenAreas(text: string): string[] {
  const areas: string[] = [];
  const endMatch = text.match(/الحدث في\s+([^(\[]+)/i);
  if (endMatch) return endMatch[1].split(/[,،]/).map(s => s.trim()).filter(s => s.length > 1);

  const bulletSections = text.split("•").filter(s => s.trim().length > 3);
  if (bulletSections.length > 1) {
    for (const section of bulletSections) {
      const colonMatch = section.match(/[^:]*:\s*([^]*)/);
      if (colonMatch) {
        let areasPart = colonMatch[1].replace(/\([^)]*(?:ثانية|ثواني|دقيقة|دقائق|ونصف)[^)]*\)/g, "").replace(/\d{1,2}:\d{2}:/g, "");
        const parts = areasPart.split(/[,،]/).map(s => s.trim()).filter(s => s.length > 1);
        for (const part of parts) {
          const clean = part.replace(/\s*-\s*(شرق|غرب|مركز|شمال|جنوب|نافيه\s*\S*|مفراتس|نيفيه\s*\S*)$/i, "").replace(/\[.*?\]/g, "").trim();
          if (clean.length > 1) areas.push(clean);
        }
      }
    }
  }
  if (areas.length === 0) {
    const simple = [/خطالمواجهة\s*:\s*([^(\[]+)/i, /خط\s+المواجهة\s*:\s*([^(\[]+)/i, /تسلل[^:]*:\s*([^(\[]+)/i];
    for (const p of simple) { const m = text.match(p); if (m) { areas.push(...m[1].replace(/\([^)]*\)/g, "").split(/[,،]/).map(s => s.trim()).filter(s => s.length > 1)); break; } }
  }
  if (areas.length === 0) { for (const name of Object.keys(AREA_MAPPING)) { if (name.length > 3 && text.includes(name)) areas.push(name); } }
  return areas.map(a => a.replace(/[\[\]🔴⚠️🚨✈️]/g, "").trim()).filter(a => a.length > 1);
}

function findIsraeliArea(name: string): { name: string; lat: number; lng: number } {
  if (AREA_MAPPING[name]) return AREA_MAPPING[name];
  const trimmed = name.trim();
  if (AREA_MAPPING[trimmed]) return AREA_MAPPING[trimmed];
  for (const [key, value] of Object.entries(AREA_MAPPING)) { if (key.includes(trimmed) || trimmed.includes(key)) return value; }
  return FALLBACK;
}

/* ─── Format share message ─── */
function formatShareMessage(typeLabel: string, area: string, desc: string, alertId: number, remaining: string): string {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return [
    `🚨 ${typeLabel} — ${area}`,
    `⏱ ${remaining}`,
    `📅 ${date} · ${time}`,
    `🗺️ ${SITE_URL}/?alert=${alertId}`,
    `📢 ${TELEGRAM_CHANNEL}`,
    `📱 ${WHATSAPP_CHANNEL}`,
  ].join("\n");
}

/* ═══════════════════════════════════════════════════════
   WEBHOOK HANDLER
   ═══════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const tgSecret = req.headers.get("x-telegram-bot-api-secret-token");
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!expectedSecret || tgSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = await req.json();
    const message = update.message || update.channel_post;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const text: string = message.text;

    /* ─── 1. Handle END messages — expire siren alerts ─── */
    if (isEndMessage(text)) {
      const endAreas = extractSirenAreas(text);
      for (const areaName of endAreas) {
        const mapped = findIsraeliArea(areaName);
        await supabaseAdmin.from("alerts").update({ status: "hidden" })
          .eq("area", mapped.name).in("type", ["siren_missile", "siren_drone", "siren"]).eq("status", "active");
      }
      return NextResponse.json({ ok: true, action: "expired", areas: endAreas });
    }

    /* ─── 2. Handle Avichay / IDF spokesman warnings ─── */
    if (isAvichayWarning(text)) {
      const villageNames = extractAvichayVillages(text);
      if (villageNames.length === 0) return NextResponse.json({ ok: true, skipped: true, reason: "no villages found" });

      const matchedAreas: AreaEntry[] = [];
      const unmatchedNames: string[] = [];
      const seen = new Set<string>();

      for (const vName of villageNames) {
        const found = findLebaneseArea(vName);
        if (found && !seen.has(found.name)) {
          seen.add(found.name);
          matchedAreas.push(found);
        } else if (!found) {
          unmatchedNames.push(vName);
        }
      }

      if (matchedAreas.length === 0) return NextResponse.json({ ok: true, skipped: true, reason: "no areas matched", tried: villageNames });

      const allNames = matchedAreas.map(a => a.name).join("، ");
      const desc = `⚠️ إنذار عاجل: على سكان ${allNames} إخلاء منازلهم فوراً. تحذير من المتحدث باسم جيش العدو.`;

      const rows = matchedAreas.map(area => ({
        title: "⚠️ تحذير إخلاء",
        area: area.name,
        type: "threat",
        type_label: "⚠️ تحذير إخلاء",
        color: "#F59E0B",
        description: desc,
        lat: area.lat, lng: area.lng,
        radius: 1500,
        expires_at: new Date(Date.now() + 120 * 60000).toISOString(), // 2 hours
        status: "active",
        is_urgent: true,
      }));

      const { data: inserted, error } = await supabaseAdmin.from("alerts").insert(rows).select("id");
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

      // Auto-post to Telegram channel
      if (BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
        const firstId = inserted?.[0]?.id || 0;
        const channelMsg = [
          `🚨⚠️ تحذير إخلاء عاجل ⚠️🚨`,
          ``,
          `📍 ${allNames}`,
          ``,
          `${desc}`,
          ``,
          `⏱ 2 ${`ساعة`}`,
          `📅 ${new Date().toLocaleDateString("ar-LB", { day: "numeric", month: "long", year: "numeric" })}`,
          `🗺️ الخريطة المباشرة: ${SITE_URL}/?alert=${firstId}`,
          `📢 تلغرام: ${TELEGRAM_CHANNEL}`,
          `📱 واتساب: ${WHATSAPP_CHANNEL}`,
          ``,
          `#البيان #تحذير_إخلاء #لبنان`,
        ].join("\n");

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHANNEL_ID, text: channelMsg }),
        }).catch(() => {});
      }

      return NextResponse.json({ ok: true, action: "avichay_warning", created: rows.length, areas: matchedAreas.map(a => a.name), unmatched: unmatchedNames });
    }

    /* ─── 3. Handle siren alerts (existing logic) ─── */
    if (!isAlert(text)) return NextResponse.json({ ok: true, skipped: true });

    const alertType = isDroneAlert(text) ? "siren_drone" : "siren_missile";
    const areaNames = extractSirenAreas(text);
    if (areaNames.length === 0) return NextResponse.json({ ok: true, skipped: true });

    const shelterMatch = text.match(/\((\d+)\s*ثانية\)/);
    const shelterTime = shelterMatch ? shelterMatch[1] + " ثانية" : "";

    const alertAreas: { name: string; lat: number; lng: number }[] = [];
    const seen = new Set<string>();
    for (const area of areaNames) {
      const mapped = findIsraeliArea(area);
      if (!seen.has(mapped.name)) { seen.add(mapped.name); alertAreas.push(mapped); }
    }

    const isMissile = alertType === "siren_missile";
    const typeLabel = isMissile ? "🚀 صواريخ" : "✈️ مسيّرات معادية";
    const shelterNote = shelterTime ? ` وقت الاحتماء: ${shelterTime}.` : "";
    const sirenDesc = isMissile
      ? `إطلاق صواريخ باتجاه ${alertAreas.map(a => a.name).join("، ")}.${shelterNote}`
      : `اختراق طائرات مسيّرة معادية أجواء ${alertAreas.map(a => a.name).join("، ")}.${shelterNote}`;

    const rows = alertAreas.map(area => ({
      title: typeLabel, area: area.name, type: alertType, type_label: typeLabel,
      color: "#EF4444", description: sirenDesc, lat: area.lat, lng: area.lng,
      radius: 3000, expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
      status: "active", is_urgent: true,
    }));

    const { data: inserted, error } = await supabaseAdmin.from("alerts").insert(rows).select("id");
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    if (BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
      const emoji = isMissile ? "🚀" : "✈️";
      const firstId = inserted?.[0]?.id || 0;
      const channelMsg = [
        `${emoji} ${typeLabel} ${emoji}`,
        ``,
        `📍 ${alertAreas.map(a => a.name).join("، ")}`,
        shelterNote ? `⏱${shelterNote}` : "",
        ``,
        `📅 ${new Date().toLocaleDateString("ar-LB", { day: "numeric", month: "long", year: "numeric" })}`,
        `🗺️ الخريطة المباشرة: ${SITE_URL}/?alert=${firstId}`,
        `📢 تلغرام: ${TELEGRAM_CHANNEL}`,
        `📱 واتساب: ${WHATSAPP_CHANNEL}`,
        ``,
        `#البيان #صافرات`,
      ].filter(Boolean).join("\n");

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHANNEL_ID, text: channelMsg }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, created: rows.length, type: alertType, areas: alertAreas.map(a => a.name) });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
