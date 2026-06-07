import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Area mapping: Arabic name variants → { canonical name, lat, lng }
// Includes Tzofar Arabic transliterations + our standard names
const AREA_MAPPING: Record<string, { name: string; lat: number; lng: number }> = {
  // === Border settlements ===
  "المطلة": { name: "المطلة", lat: 33.2778, lng: 35.5731 },
  "مطولا": { name: "المطلة", lat: 33.2778, lng: 35.5731 },
  "متولا": { name: "المطلة", lat: 33.2778, lng: 35.5731 },
  "كريات شمونة": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "كريات شمونا": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "قريات شمونة": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "سديه نحميا": { name: "سديه نحميا", lat: 33.2394, lng: 35.5592 },
  "كفار غلعادي": { name: "كفار غلعادي", lat: 33.2428, lng: 35.5683 },
  "كفر جلعادي": { name: "كفار غلعادي", lat: 33.2428, lng: 35.5683 },
  "تل حاي": { name: "تل حاي", lat: 33.2347, lng: 35.5689 },
  "مسغاف عام": { name: "مسغاف عام", lat: 33.0797, lng: 35.5244 },
  "المنارة": { name: "المنارة", lat: 33.2486, lng: 35.5322 },
  "مرغليوت": { name: "مرغليوت", lat: 33.2247, lng: 35.5347 },
  "مرجليوت": { name: "مرغليوت", lat: 33.2247, lng: 35.5347 },
  "دفنا": { name: "دفنا", lat: 33.2267, lng: 35.64 },
  "دان": { name: "دان", lat: 33.2492, lng: 35.6519 },
  "هغوشريم": { name: "هغوشريم", lat: 33.2261, lng: 35.6156 },
  "شلومي": { name: "شلومي", lat: 33.0747, lng: 35.1417 },
  "رأس الناقورة": { name: "رأس الناقورة", lat: 33.0893, lng: 35.1058 },
  "زرعيت": { name: "زرعيت", lat: 33.0822, lng: 35.1497 },
  "شتولا": { name: "شتولا", lat: 33.0775, lng: 35.2075 },
  "حنيتا": { name: "حنيتا", lat: 33.0722, lng: 35.1736 },
  "دوفيف": { name: "دوفيف", lat: 33.0631, lng: 35.4214 },
  "دوفب": { name: "دوفيف", lat: 33.0631, lng: 35.4214 },
  "أفيفيم": { name: "أفيفيم", lat: 33.0547, lng: 35.4022 },
  "افيفيم": { name: "أفيفيم", lat: 33.0547, lng: 35.4022 },
  "يفتاح": { name: "يفتاح", lat: 33.1192, lng: 35.5008 },
  "يفتح": { name: "يفتاح", lat: 33.1192, lng: 35.5008 },
  "راموت نفتالي": { name: "راموت نفتالي", lat: 33.1025, lng: 35.5061 },
  "راموت نافتالي": { name: "راموت نفتالي", lat: 33.1025, lng: 35.5061 },
  "رموت نفتالي": { name: "راموت نفتالي", lat: 33.1025, lng: 35.5061 },
  "ملكية": { name: "ملكية", lat: 33.0858, lng: 35.4672 },
  "ملخيا": { name: "ملكية", lat: 33.0858, lng: 35.4672 },
  "يرعون": { name: "يرعون", lat: 33.0789, lng: 35.4456 },
  "يرؤون": { name: "يرعون", lat: 33.0789, lng: 35.4456 },
  "ديشون": { name: "ديشون", lat: 33.0978, lng: 35.4494 },
  "أيلون": { name: "أيلون", lat: 33.0567, lng: 35.2408 },
  "ايلون": { name: "أيلون", lat: 33.0567, lng: 35.2408 },
  "إيفن مناحم": { name: "إيفن مناحم", lat: 33.0533, lng: 35.35 },
  "ايفن مناحم": { name: "إيفن مناحم", lat: 33.0533, lng: 35.35 },
  "بتسيت": { name: "بتسيت", lat: 33.0531, lng: 35.1608 },
  // === Northern cities ===
  "نهاريا": { name: "نهاريا", lat: 33.0061, lng: 35.0986 },
  "نهريا": { name: "نهاريا", lat: 33.0061, lng: 35.0986 },
  "عكا": { name: "عكا", lat: 32.928, lng: 35.0764 },
  "عكو": { name: "عكا", lat: 32.928, lng: 35.0764 },
  "صفد": { name: "صفد", lat: 32.9646, lng: 35.4964 },
  "تسفات": { name: "صفد", lat: 32.9646, lng: 35.4964 },
  "طبريا": { name: "طبريا", lat: 32.7922, lng: 35.5312 },
  "طبرية": { name: "طبريا", lat: 32.7922, lng: 35.5312 },
  "كرميئيل": { name: "كرميئيل", lat: 32.9136, lng: 35.3061 },
  "كرمئيل": { name: "كرميئيل", lat: 32.9136, lng: 35.3061 },
  "معالوت": { name: "معالوت", lat: 33.0167, lng: 35.2719 },
  "معالوت ترشيحا": { name: "معالوت", lat: 33.0167, lng: 35.2719 },
  "حتسور": { name: "حتسور", lat: 32.9847, lng: 35.5403 },
  "حاتسور": { name: "حتسور", lat: 32.9847, lng: 35.5403 },
  "الناصرة": { name: "الناصرة", lat: 32.6996, lng: 35.3035 },
  "نتسيرت": { name: "الناصرة", lat: 32.6996, lng: 35.3035 },
  "نوف هجليل": { name: "نوف هجليل", lat: 32.727, lng: 35.3215 },
  "العفولة": { name: "العفولة", lat: 32.6063, lng: 35.2893 },
  "عفولة": { name: "العفولة", lat: 32.6063, lng: 35.2893 },
  "بيسان": { name: "بيسان", lat: 32.4971, lng: 35.4967 },
  "بيت شان": { name: "بيسان", lat: 32.4971, lng: 35.4967 },
  "شفاعمرو": { name: "شفاعمرو", lat: 32.8053, lng: 35.1692 },
  "مجدل شمس": { name: "مجدل شمس", lat: 33.271, lng: 35.77 },
  // === Haifa metro ===
  "حيفا": { name: "حيفا", lat: 32.794, lng: 34.9896 },
  "الخضيرة": { name: "الخضيرة", lat: 32.4341, lng: 34.9196 },
  "خضيرة": { name: "الخضيرة", lat: 32.4341, lng: 34.9196 },
  "كريات آتا": { name: "كريات آتا", lat: 32.81, lng: 35.1 },
  "كريات بياليك": { name: "كريات بياليك", lat: 32.83, lng: 35.08 },
  "كريات موتسكين": { name: "كريات موتسكين", lat: 32.84, lng: 35.07 },
  "كريات يام": { name: "كريات يام", lat: 32.85, lng: 35.06 },
  "نيشر": { name: "نيشر", lat: 32.77, lng: 35.04 },
  "طيرة الكرمل": { name: "طيرة الكرمل", lat: 32.76, lng: 34.97 },
  "عتليت": { name: "عتليت", lat: 32.6873, lng: 34.9404 },
  "أم الفحم": { name: "أم الفحم", lat: 32.5169, lng: 35.1536 },
  "ام الفحم": { name: "أم الفحم", lat: 32.5169, lng: 35.1536 },
  // === Central ===
  "تل أبيب": { name: "تل أبيب", lat: 32.0853, lng: 34.7818 },
  "تل ابيب": { name: "تل أبيب", lat: 32.0853, lng: 34.7818 },
  "نتانيا": { name: "نتانيا", lat: 32.3215, lng: 34.8532 },
  "نتنيا": { name: "نتانيا", lat: 32.3215, lng: 34.8532 },
  "هرتسليا": { name: "هرتسليا", lat: 32.1624, lng: 34.7916 },
  "هرتسيليا": { name: "هرتسليا", lat: 32.1624, lng: 34.7916 },
  "رمات غان": { name: "رمات غان", lat: 32.068, lng: 34.8237 },
  "رمات جان": { name: "رمات غان", lat: 32.068, lng: 34.8237 },
  "بني براك": { name: "بني براك", lat: 32.0831, lng: 34.8344 },
  "بني برك": { name: "بني براك", lat: 32.0831, lng: 34.8344 },
  "بتاح تكفا": { name: "بتاح تكفا", lat: 32.0841, lng: 34.8878 },
  "بتح تكفا": { name: "بتاح تكفا", lat: 32.0841, lng: 34.8878 },
  "كفار سابا": { name: "كفار سابا", lat: 32.1715, lng: 34.9073 },
  "كفر سابا": { name: "كفار سابا", lat: 32.1715, lng: 34.9073 },
  "رعنانا": { name: "رعنانا", lat: 32.1841, lng: 34.871 },
  "رعننا": { name: "رعنانا", lat: 32.1841, lng: 34.871 },
  "هود هشارون": { name: "هود هشارون", lat: 32.154, lng: 34.887 },
  "حولون": { name: "حولون", lat: 32.0117, lng: 34.7749 },
  "بات يام": { name: "بات يام", lat: 32.0167, lng: 34.751 },
  "اللد": { name: "اللد", lat: 31.9516, lng: 34.8953 },
  "لود": { name: "اللد", lat: 31.9516, lng: 34.8953 },
  "الرملة": { name: "الرملة", lat: 31.929, lng: 34.8706 },
  "رملة": { name: "الرملة", lat: 31.929, lng: 34.8706 },
  "ريشون لتسيون": { name: "ريشون لتسيون", lat: 31.973, lng: 34.7925 },
  "ريشون لتصيون": { name: "ريشون لتسيون", lat: 31.973, lng: 34.7925 },
  "رحوفوت": { name: "رحوفوت", lat: 31.8928, lng: 34.8113 },
  "رحوبوت": { name: "رحوفوت", lat: 31.8928, lng: 34.8113 },
  "أشدود": { name: "أشدود", lat: 31.8014, lng: 34.6503 },
  "اشدود": { name: "أشدود", lat: 31.8014, lng: 34.6503 },
  "عسقلان": { name: "عسقلان", lat: 31.6658, lng: 34.5715 },
  "اشكلون": { name: "عسقلان", lat: 31.6658, lng: 34.5715 },
  "القدس": { name: "القدس", lat: 31.7683, lng: 35.2137 },
  "بئر السبع": { name: "بئر السبع", lat: 31.2518, lng: 34.7913 },
  "بير السبع": { name: "بئر السبع", lat: 31.2518, lng: 34.7913 },
  "بئر شيبع": { name: "بئر السبع", lat: 31.2518, lng: 34.7913 },
  "سديروت": { name: "سديروت", lat: 31.5247, lng: 34.5967 },
  "كريات جات": { name: "كريات جات", lat: 31.6089, lng: 34.7583 },
  "موديعين": { name: "موديعين", lat: 31.8977, lng: 35.0102 },
  "بيت شيمش": { name: "بيت شيمش", lat: 31.7466, lng: 34.9886 },
  "كتسرين": { name: "كتسرين", lat: 32.9925, lng: 35.6917 },
  "قتسرين": { name: "كتسرين", lat: 32.9925, lng: 35.6917 },
  "ساخنين": { name: "ساخنين", lat: 32.8628, lng: 35.2942 },
  "طمرة": { name: "طمرة", lat: 32.8531, lng: 35.1975 },
  "ديمونا": { name: "ديمونا", lat: 31.0697, lng: 35.0367 },
  "إيلات": { name: "إيلات", lat: 29.5577, lng: 34.9519 },
  "ايلات": { name: "إيلات", lat: 29.5577, lng: 34.9519 },
  // === Golan ===
  "الجولان": { name: "الجولان", lat: 33.0, lng: 35.75 },
  "الجليل الأعلى": { name: "الجليل الأعلى", lat: 33.05, lng: 35.5 },
  // === Hebrew names (fallback) ===
  "קריית שמונה": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "מטולה": { name: "المطلة", lat: 33.2778, lng: 35.5731 },
  "חיפה": { name: "حيفا", lat: 32.794, lng: 34.9896 },
  "תל אביב": { name: "تل أبيب", lat: 32.0853, lng: 34.7818 },
  "ירושלים": { name: "القدس", lat: 31.7683, lng: 35.2137 },
  "נהריה": { name: "نهاريا", lat: 33.0061, lng: 35.0986 },
  "עכו": { name: "عكا", lat: 32.928, lng: 35.0764 },
  "צפת": { name: "صفد", lat: 32.9646, lng: 35.4964 },
  "יפתח": { name: "يفتاح", lat: 33.1192, lng: 35.5008 },
  "רמות נפתלי": { name: "راموت نفتالي", lat: 33.1025, lng: 35.5061 },
};

const FALLBACK = { name: "شمال فلسطين المحتلة", lat: 33.05, lng: 35.45 };

// === Alert type detection ===
// Arabic Tzofar format: 🔴 اللون الأحمر ... خط المواجهة / اختراق مسيرات
// Hebrew format: צבע אדום / חדירת כלי טיס
const IS_ALERT = [/اللون الأحمر/i, /انذار احمر/i, /צבע אדום/i, /red alert/i, /🔴/, /تسلل طائرة/i, /طائرة بدون طيار/i, /✈️/, /خطالمواجهة/i, /خط المواجهة/i];
const IS_END = [/انتهى الحدث/i, /لقد انتهى/i];
const IS_DRONE = [/مسيّر/i, /مسير/i, /طائر/i, /بدون طيار/i, /تسلل طائرة/i, /כלי טיס/i, /drone/i, /uav/i, /✈️/];

function isAlert(text: string): boolean {
  return IS_ALERT.some((p) => p.test(text));
}

function isEndMessage(text: string): boolean {
  return IS_END.some((p) => p.test(text));
}

function isDroneAlert(text: string): boolean {
  return IS_DRONE.some((p) => p.test(text));
}

function extractAreas(text: string): string[] {
  const areas: string[] = [];

  // Arabic Tzofar format: "• خطالمواجهة: راموت نافتالي, يفتاح (15 ثانية)"
  // Drone format: "✈️ تسلل طائرة بدون طيار ... • خطالمواجهة: تل ابيب"
  // End format: "لقد انتهى الحدث في يفتاح, راموت نافتالي"
  const patterns = [
    /خطالمواجهة\s*:\s*([^(\[]+)/i,
    /خط\s+المواجهة\s*:\s*([^(\[]+)/i,
    /اختراق[^:]*:\s*([^(\[]+)/i,
    /الحدث في\s+([^(\[]+)/i,
    /بدون طيار[^:]*:\s*([^(\[]+)/i,
    /تسلل[^:]*:\s*([^(\[]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1].trim();
      const parts = raw.split(/[,،]/).map((s) => s.trim()).filter((s) => s.length > 1);
      if (parts.length > 0) {
        areas.push(...parts);
        break;
      }
    }
  }

  // Fallback: scan for known names
  if (areas.length === 0) {
    for (const name of Object.keys(AREA_MAPPING)) {
      if (text.includes(name)) areas.push(name);
    }
  }

  // Clean up: remove time references like (15 ثانية), brackets, emojis
  return areas
    .map((a) => a.replace(/\(\d+\s*ثانية\)/g, "").replace(/[\[\]🔴⚠️🚨]/g, "").trim())
    .filter((a) => a.length > 1);
}

function findArea(name: string): { name: string; lat: number; lng: number } {
  // Exact match
  if (AREA_MAPPING[name]) return AREA_MAPPING[name];
  // Trimmed match
  const trimmed = name.trim();
  if (AREA_MAPPING[trimmed]) return AREA_MAPPING[trimmed];
  // Partial match
  for (const [key, value] of Object.entries(AREA_MAPPING)) {
    if (key.includes(trimmed) || trimmed.includes(key)) return value;
  }
  return FALLBACK;
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update.message || update.channel_post;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const text: string = message.text;

    // Handle END messages — expire matching alerts
    if (isEndMessage(text)) {
      const endAreas = extractAreas(text);
      for (const areaName of endAreas) {
        const mapped = findArea(areaName);
        await supabaseAdmin
          .from("alerts")
          .update({ status: "hidden" })
          .eq("area", mapped.name)
          .in("type", ["siren_missile", "siren_drone", "siren"])
          .eq("status", "active");
      }
      return NextResponse.json({ ok: true, action: "expired", areas: endAreas });
    }

    // Handle START messages
    if (!isAlert(text)) return NextResponse.json({ ok: true, skipped: true });

    const alertType = isDroneAlert(text) ? "siren_drone" : "siren_missile";
    const areaNames = extractAreas(text);
    if (areaNames.length === 0) return NextResponse.json({ ok: true, skipped: true });

    // Extract shelter time if available
    const shelterMatch = text.match(/\((\d+)\s*ثانية\)/);
    const shelterTime = shelterMatch ? shelterMatch[1] + " ثانية" : "";

    const alertAreas: { name: string; lat: number; lng: number }[] = [];
    const seen = new Set<string>();
    for (const area of areaNames) {
      const mapped = findArea(area);
      if (!seen.has(mapped.name)) { seen.add(mapped.name); alertAreas.push(mapped); }
    }

    const isMissile = alertType === "siren_missile";
    const typeLabel = isMissile ? "🚀 صواريخ" : "✈️ مسيّرات معادية";
    const shelterNote = shelterTime ? ` وقت الاحتماء: ${shelterTime}.` : "";
    const desc = isMissile
      ? `إطلاق صواريخ باتجاه ${alertAreas.map((a) => a.name).join("، ")}.${shelterNote} يرجى أخذ الحيطة والحذر.`
      : `اختراق طائرات مسيّرة معادية أجواء ${alertAreas.map((a) => a.name).join("، ")}.${shelterNote} يرجى أخذ الحيطة والحذر.`;

    const rows = alertAreas.map((area) => ({
      title: typeLabel,
      area: area.name,
      type: alertType,
      type_label: typeLabel,
      color: "#EF4444",
      description: desc,
      lat: area.lat, lng: area.lng,
      radius: 3000,
      expires_at: new Date(Date.now() + 60 * 60000).toISOString(),
      status: "active",
      is_urgent: true,
    }));

    const { error } = await supabaseAdmin.from("alerts").insert(rows);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    // Auto-post to our Telegram channel
    if (BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
      const emoji = isMissile ? "🚀" : "✈️";
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHANNEL_ID,
          text: `${emoji} ${typeLabel} ${emoji}\n\n📍 ${alertAreas.map((a) => a.name).join("، ")}\n${shelterNote ? `⏱ ${shelterNote}\n` : ""}\n⚠️ يرجى أخذ الحيطة والحذر\n\n#البيان`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, created: rows.length, type: alertType, areas: alertAreas.map((a) => a.name) });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
