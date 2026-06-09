import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = "https://albayan-lb.com";
const TELEGRAM_CHANNEL = "https://t.me/AlBayan_Newss";
const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbApl8OBlHpfDzyrrT0f";

/* ─── Israeli region mapping for Red Alert sections ─── */
type RegionEntry = { name: string; lat: number; lng: number; radius: number };

// Keys use normSection() form (spaces removed, أ/إ/آ→ا, ة→ه, ى→ي)
// Both the key lookup and the query are normalized so spacing variants match
const SECTION_MAPPING: Record<string, RegionEntry> = {
  // همفراتس = HaMifrats (Haifa Bay, coastal strip north of Haifa)
  "همفراتس":          { name: "منطقة همفراتس",       lat: 32.84, lng: 35.06, radius: 11000 },

  // Haifa city
  "حيفا":             { name: "حيفا",                 lat: 32.80, lng: 34.99, radius:  8000 },

  // Upper Galilee
  "الجليلالاعلى":     { name: "الجليل الأعلى",        lat: 32.99, lng: 35.33, radius: 18000 },

  // Lower Galilee
  "الجليلالاسفل":     { name: "الجليل الأسفل",        lat: 32.73, lng: 35.37, radius: 14000 },

  // Central Galilee
  "مركزالجليل":       { name: "مركز الجليل",          lat: 32.87, lng: 35.27, radius: 18000 },

  // Western Galilee
  "الجليلالغربي":     { name: "الجليل الغربي",        lat: 33.00, lng: 35.14, radius: 15000 },

  // Northern Golan
  "الجولانالشمالي":   { name: "الجولان الشمالي",      lat: 33.16, lng: 35.76, radius: 18000 },

  // Southern Golan
  "الجولانالجنوبي":   { name: "الجولان الجنوبي",      lat: 32.83, lng: 35.74, radius: 18000 },

  // Wadi Ara triangle
  "واديعاره":         { name: "منطقة وادي عارة",      lat: 32.47, lng: 35.08, radius: 10000 },

  // Carmel region (south of Haifa)
  "الكرمل":           { name: "منطقة الكرمل",         lat: 32.71, lng: 34.97, radius: 12000 },

  // Confrontation line (Lebanese border)
  "خطالمواجهه":       { name: "خط المواجهة",          lat: 33.10, lng: 35.43, radius: 24000 },

  // Valleys (Jezreel / Beit She'an)
  "العمقيم":          { name: "منطقة الأودية",        lat: 32.62, lng: 35.18, radius: 14000 },
  "عمقيزرعيل":       { name: "وادي يزرعيل",          lat: 32.62, lng: 35.25, radius: 12000 },

  // Sharon / Center coast
  "الشارون":          { name: "منطقة الشارون",        lat: 32.35, lng: 34.92, radius: 15000 },
  "مركزالبلاد":       { name: "وسط البلاد",           lat: 32.08, lng: 34.85, radius: 20000 },
  "المركز":           { name: "وسط البلاد",           lat: 32.08, lng: 34.85, radius: 20000 },

  // Hadera / Iron area
  "حيفاوعكا":         { name: "منطقة حيفا وعكا",     lat: 32.86, lng: 35.03, radius: 14000 },
  "حدره":             { name: "منطقة حدرا",           lat: 32.43, lng: 34.92, radius: 12000 },

  // South / Negev
  "الجنوب":           { name: "منطقة الجنوب",         lat: 31.25, lng: 34.79, radius: 25000 },
  "النقب":            { name: "النقب",                lat: 31.25, lng: 34.79, radius: 25000 },

  // Gaza envelope
  "غلافغزه":          { name: "غلاف غزة",             lat: 31.44, lng: 34.60, radius: 12000 },

  // Jerusalem area
  "القدس":            { name: "القدس",                lat: 31.77, lng: 35.21, radius: 12000 },
  "يهودا":            { name: "منطقة يهودا",          lat: 31.70, lng: 35.20, radius: 15000 },

  // Lowlands (Shfela)
  "الشفله":           { name: "منطقة الشفلة",         lat: 31.78, lng: 34.85, radius: 15000 },

  // Tiberias / Kinneret
  "كينيريت":          { name: "منطقة كينيريت",        lat: 32.80, lng: 35.55, radius: 10000 },
  "طبريا":            { name: "طبريا",                lat: 32.80, lng: 35.53, radius:  8000 },

  // Ashkelon / Ashdod coast
  "عسقلان":           { name: "عسقلان",               lat: 31.67, lng: 34.57, radius:  8000 },
  "اشدود":            { name: "أشدود",                lat: 31.80, lng: 34.65, radius:  8000 },
};

function normSection(s: string): string {
  return s.trim()
    .replace(/\s+/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

function findSection(rawName: string): RegionEntry | null {
  const norm = normSection(rawName);
  // Direct lookup with normalized form
  if (SECTION_MAPPING[norm]) return SECTION_MAPPING[norm];
  // Scan all keys normalized
  for (const [key, val] of Object.entries(SECTION_MAPPING)) {
    const nk = normSection(key);
    if (nk === norm) return val;
    if (nk.length >= 4 && norm.length >= 4 && (nk.includes(norm) || norm.includes(nk))) return val;
  }
  return null;
}

/* ─── Israeli area mapping for older siren message formats ─── */
const AREA_MAPPING: Record<string, { name: string; lat: number; lng: number }> = {
  "المطلة":        { name: "المطلة",         lat: 33.2778, lng: 35.5731 },
  "مطولا":         { name: "المطلة",         lat: 33.2778, lng: 35.5731 },
  "كريات شمونة":   { name: "كريات شمونة",    lat: 33.2073, lng: 35.5713 },
  "كريات شمونا":   { name: "كريات شمونة",    lat: 33.2073, lng: 35.5713 },
  "نهاريا":        { name: "نهاريا",         lat: 33.0061, lng: 35.0986 },
  "نهريا":         { name: "نهاريا",         lat: 33.0061, lng: 35.0986 },
  "شلومي":         { name: "شلومي",          lat: 33.0747, lng: 35.1417 },
  "مسغاف عام":     { name: "مسغاف عام",      lat: 33.0797, lng: 35.5244 },
  "أفيفيم":        { name: "أفيفيم",         lat: 33.0547, lng: 35.4022 },
  "دوفيف":         { name: "دوفيف",          lat: 33.0631, lng: 35.4214 },
  "يفتاح":         { name: "يفتاح",          lat: 33.1192, lng: 35.5008 },
  "مرغليوت":       { name: "مرغليوت",        lat: 33.2389, lng: 35.5589 },
  "المنارة":       { name: "المنارة",        lat: 33.2325, lng: 35.5261 },
  "حنيتا":         { name: "حنيتا",          lat: 33.1028, lng: 35.1994 },
  "عكا":           { name: "عكا",            lat: 32.9280, lng: 35.0764 },
  "صفد":           { name: "صفد",            lat: 32.9646, lng: 35.4964 },
  "حيفا":          { name: "حيفا",           lat: 32.7940, lng: 34.9896 },
  "كرمئيل":        { name: "كرمئيل",         lat: 32.9138, lng: 35.2971 },
  "الناصرة":       { name: "الناصرة",        lat: 32.6996, lng: 35.3035 },
  "طبريا":         { name: "طبريا",          lat: 32.7957, lng: 35.5302 },
  "الجولان":       { name: "الجولان",        lat: 33.0000, lng: 35.7700 },
  "الجليل":        { name: "الجليل",         lat: 32.9000, lng: 35.3000 },
  "تل أبيب":       { name: "تل أبيب",        lat: 32.0853, lng: 34.7818 },
  "القدس":         { name: "القدس",          lat: 31.7683, lng: 35.2137 },
  "بئر السبع":     { name: "بئر السبع",      lat: 31.2518, lng: 34.7913 },
  "أشدود":         { name: "أشدود",          lat: 31.8044, lng: 34.6553 },
  "عسقلان":        { name: "عسقلان",         lat: 31.6680, lng: 34.5710 },
  "نتانيا":        { name: "نتانيا",         lat: 32.3215, lng: 34.8532 },
  "حدرا":          { name: "حدرا",           lat: 32.4342, lng: 34.9199 },
};
const FALLBACK = { name: "شمال إسرائيل", lat: 33.07, lng: 35.37 };

/* ─── Detection patterns ─── */
const IS_RED_ALERT = /اللون\s*الاحمر|اللون\s*الأحمر|🔴\s*اللون/i;
const IS_SIREN = [/صافرات?\s*(انذار|إنذار)/i, /red\s*alert/i, /🔴.*צבע\s*אדום/i, /צבע\s*אדום/i, /אזעקה/i, /صفارات/i, /صفارة/i, /إنذار.*صاروخ/i, /خطالمواجهة/i, /خط\s+المواجهة/i, /تسلل.*طائر/i];
const IS_END   = [/הסתיים/i, /انتهى\s+الحدث/i, /الحدث\s+في.*انتهى/i, /انتهاء.*الحدث/i];
const IS_DRONE = [/طائر|مسيّر|مسير|UAV|drone|כלי\s*טיס/i];

function isRedAlert(text: string): boolean { return IS_RED_ALERT.test(text); }
function isAlert(text: string): boolean    { return IS_SIREN.some((p) => p.test(text)); }
function isEndMessage(text: string): boolean { return IS_END.some((p) => p.test(text)); }
function isDroneAlert(text: string): boolean  { return IS_DRONE.some((p) => p.test(text)); }

/* ─── Parse Red Alert sections from اللون الأحمر format ─── */
// Format: "• SectionName: city1, city2, city3 (shelter time)"
function extractRedAlertSections(text: string): Array<{ section: string; cities: string[]; shelter: string }> {
  const bySection = new Map<string, { section: string; cities: string[]; shelter: string }>();

  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("•")) continue;

    const content = trimmed.slice(1).trim();
    const colonIdx = content.indexOf(":");
    if (colonIdx === -1 || colonIdx > 35) continue;

    const sectionRaw = content.slice(0, colonIdx).trim();
    if (!sectionRaw) continue;

    let rest = content.slice(colonIdx + 1).trim();

    // Pull shelter time from trailing parens: (دقيقة), (15 ثانية), (دقيقة ونصف), etc.
    const shelterMatch = rest.match(/\(([^)]*(?:ثانية|دقيقة|ونصف|فوري)[^)]*)\)\s*$/);
    const shelter = shelterMatch ? shelterMatch[1].trim() : "";
    if (shelterMatch) rest = rest.slice(0, shelterMatch.index).trim();

    // Remove inline parens (sub-area notes) and clean
    rest = rest.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ");

    const cities = rest.split(/[,،]/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 60);

    if (cities.length === 0) continue;

    const key = normSection(sectionRaw);
    if (bySection.has(key)) {
      bySection.get(key)!.cities.push(...cities);
    } else {
      bySection.set(key, { section: sectionRaw, cities, shelter });
    }
  }

  return Array.from(bySection.values());
}

/* ─── Extract areas from older siren message format ─── */
function extractSirenAreas(text: string): string[] {
  const areas: string[] = [];

  const endMatch = text.match(/الحدث في\s+([^(\[]+)/i);
  if (endMatch) return endMatch[1].split(/[,،]/).map(s => s.trim()).filter(s => s.length > 1);

  const bulletSections = text.split("•").filter(s => s.trim().length > 3);
  if (bulletSections.length > 1) {
    for (const section of bulletSections) {
      const colonMatch = section.match(/[^:]*:\s*([^]*)/);
      if (colonMatch) {
        let areasPart = colonMatch[1]
          .replace(/\([^)]*(?:ثانية|ثواني|دقيقة|دقائق|ونصف)[^)]*\)/g, "")
          .replace(/\d{1,2}:\d{2}:/g, "");
        const parts = areasPart.split(/[,،]/).map(s => s.trim()).filter(s => s.length > 1);
        for (const part of parts) {
          const clean = part
            .replace(/\s*-\s*(شرق|غرب|مركز|شمال|جنوب|نافيه\s*\S*|مفراتس|نيفيه\s*\S*)$/i, "")
            .replace(/\[.*?\]/g, "")
            .trim();
          if (clean.length > 1) areas.push(clean);
        }
      }
    }
  }

  if (areas.length === 0) {
    const simple = [/خطالمواجهة\s*:\s*([^(\[]+)/i, /خط\s+المواجهة\s*:\s*([^(\[]+)/i, /تسلل[^:]*:\s*([^(\[]+)/i];
    for (const p of simple) {
      const m = text.match(p);
      if (m) { areas.push(...m[1].replace(/\([^)]*\)/g, "").split(/[,،]/).map(s => s.trim()).filter(s => s.length > 1)); break; }
    }
  }

  if (areas.length === 0) {
    for (const name of Object.keys(AREA_MAPPING)) {
      if (name.length > 3 && text.includes(name)) areas.push(name);
    }
  }

  return areas.map(a => a.replace(/[\[\]🔴⚠️🚨✈️]/g, "").trim()).filter(a => a.length > 1);
}

function findIsraeliArea(name: string): { name: string; lat: number; lng: number } | null {
  if (AREA_MAPPING[name]) return AREA_MAPPING[name];
  const trimmed = name.trim();
  if (AREA_MAPPING[trimmed]) return AREA_MAPPING[trimmed];
  for (const [key, value] of Object.entries(AREA_MAPPING)) {
    if (key.length > 3 && (key.includes(trimmed) || trimmed.includes(key))) return value;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════
   WEBHOOK HANDLER
   ═══════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  try {
    const tgSecret = req.headers.get("x-telegram-bot-api-secret-token");
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret && tgSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = await req.json();
    const message = update.message || update.channel_post;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const text: string = message.text;

    /* ─── 1. Expire siren alerts on end messages ─── */
    if (isEndMessage(text)) {
      const endAreas = extractSirenAreas(text);
      for (const areaName of endAreas) {
        const mapped = findIsraeliArea(areaName);
        if (!mapped) continue;
        await supabaseAdmin.from("alerts").update({ status: "hidden" })
          .eq("area", mapped.name).in("type", ["siren_missile", "siren_drone", "siren", "red_alert"]).eq("status", "active");
      }
      return NextResponse.json({ ok: true, action: "expired", areas: endAreas });
    }

    /* ─── 2. Handle Red Alert format (🔴 اللون الأحمر) ─── */
    if (isRedAlert(text)) {
      const sections = extractRedAlertSections(text);

      if (sections.length > 0) {
        const rows: object[] = [];
        const sectionNames: string[] = [];
        const unmatched: string[] = [];

        for (const { section, cities, shelter } of sections) {
          const region = findSection(section);
          if (!region) { unmatched.push(section); continue; }

          const cityList = cities.length <= 8
            ? cities.join("، ")
            : cities.slice(0, 8).join("، ") + `... (${cities.length} موقع)`;
          const shelterNote = shelter ? ` — وقت الاحتماء: ${shelter}` : "";
          const desc = `🔴 صافرات إنذار في ${region.name}: ${cityList}.${shelterNote}`;

          rows.push({
            title: "🔴 صافرات إنذار",
            area: region.name,
            type: "red_alert",
            type_label: "🔴 صافرات إنذار",
            color: "#EF4444",
            description: desc,
            lat: region.lat,
            lng: region.lng,
            radius: region.radius,
            expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
            status: "active",
            is_urgent: true,
          });
          sectionNames.push(region.name);
        }

        if (rows.length === 0) {
          return NextResponse.json({ ok: true, skipped: true, reason: "no sections matched", tried: sections.map(s => s.section) });
        }

        const { data: inserted, error } = await supabaseAdmin.from("alerts").insert(rows).select("id");
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

        if (BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
          const firstId = (inserted?.[0] as { id: number } | undefined)?.id || 0;
          const channelMsg = [
            `🔴 صافرات إنذار — اللون الأحمر 🔴`,
            ``,
            `📍 ${sectionNames.join("، ")}`,
            ``,
            `📅 ${new Date().toLocaleDateString("ar-LB", { day: "numeric", month: "long", year: "numeric" })}`,
            `🗺️ الخريطة المباشرة: ${SITE_URL}/?alert=${firstId}`,
            `📢 تلغرام: ${TELEGRAM_CHANNEL}`,
            `📱 واتساب: ${WHATSAPP_CHANNEL}`,
            ``,
            `#البيان #صافرات #اللون_الأحمر`,
          ].join("\n");

          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHANNEL_ID, text: channelMsg }),
          }).catch(() => {});
        }

        return NextResponse.json({ ok: true, action: "red_alert", created: rows.length, sections: sectionNames, unmatched });
      }
      // If sections.length === 0, fall through to generic siren detection
    }

    /* ─── 3. Handle other siren/drone alerts ─── */
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
      if (!mapped) continue;
      if (!seen.has(mapped.name)) { seen.add(mapped.name); alertAreas.push(mapped); }
    }
    if (alertAreas.length === 0) alertAreas.push(FALLBACK);

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
      const firstId = (inserted?.[0] as { id: number } | undefined)?.id || 0;
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
