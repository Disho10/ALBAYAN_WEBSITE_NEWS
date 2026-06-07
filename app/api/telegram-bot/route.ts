import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ====== ترجمة المناطق الإسرائيلية للعربية ======
const HEBREW_TO_ARABIC: Record<string, string> = {
  "נהריה": "نهاريا",
  "שלומי": "شلومي",
  "קריית שמונה": "كريات شمونة",
  "מטולה": "المطلة",
  "דובב": "دوفيف",
  "אבירים": "أفيفيم",
  "מרגליות": "مرغليوت",
  "יפתח": "يفتاح",
  "מנרה": "المنارة",
  "חניתה": "حنيتا",
  "גליל עליון": "الجليل الأعلى",
  "גולן": "الجولان",
  "צפת": "صفد",
  "עכו": "عكا",
  "חיפה": "حيفا",
  "טבריה": "طبريا",
  "כרמיאל": "كرميئيل",
  "מעלות": "معالوت",
  "עמיעד": "عميعاد",
  "חצור הגלילית": "حتسور",
  "ראש הנקרה": "رأس الناقورة",
  "זרעית": "زرعيت",
  "שתולה": "شتولا",
  "יערה": "يعرا",
  "אילון": "أيلون",
  "גורנות הגליל": "غورنوت",
  "בצת": "بتسيت",
  "כפר ורדים": "كفار فراديم",
  "הושעיה": "هوشعيا",
  "אבן מנחם": "إيفن مناحم",
  "מלכיה": "ملكية",
  "רמות נפתלי": "راموت نفتالي",
  "יראון": "يرعون",
  "דפנה": "دفنا",
  "דן": "دان",
  "סנהדריה": "سنهدريا",
  "הגושרים": "هغوشريم",
  "שדה נחמיה": "سديه نحميا",
  "כפר גלעדי": "كفار غلعادي",
  "תל חי": "تل حاي",
  "מישגב עם": "مسغاف عام",
  "דישון": "ديشون",
};

// Israeli areas with their actual coordinates and Arabic names
const AREA_MAPPING: Record<string, { name: string; lat: number; lng: number }> = {
  "נהריה": { name: "نهاريا", lat: 33.0061, lng: 35.0986 },
  "שלומי": { name: "شلومي", lat: 33.0747, lng: 35.1417 },
  "ראש הנקרה": { name: "رأس الناقورة", lat: 33.0893, lng: 35.1058 },
  "זרעית": { name: "زرعيت", lat: 33.0822, lng: 35.1497 },
  "שתולה": { name: "شتولا", lat: 33.0775, lng: 35.2075 },
  "חניתה": { name: "حنيتا", lat: 33.0722, lng: 35.1736 },
  "בצת": { name: "بتسيت", lat: 33.0531, lng: 35.1608 },
  "קריית שמונה": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "שדה נחמיה": { name: "سديه نحميا", lat: 33.2394, lng: 35.5592 },
  "כפר גלעדי": { name: "كفار غلعادي", lat: 33.2428, lng: 35.5683 },
  "תל חי": { name: "تل حاي", lat: 33.2347, lng: 35.5689 },
  "מטולה": { name: "المطلة", lat: 33.2778, lng: 35.5731 },
  "מישגב עם": { name: "مسغاف عام", lat: 33.0797, lng: 35.5244 },
  "דובב": { name: "دوفيف", lat: 33.0631, lng: 35.4214 },
  "אבירים": { name: "أفيفيم", lat: 33.0547, lng: 35.4022 },
  "מרגליות": { name: "مرغليوت", lat: 33.2247, lng: 35.5347 },
  "יפתח": { name: "يفتاح", lat: 33.1192, lng: 35.5008 },
  "רמות נפתלי": { name: "راموت نفتالي", lat: 33.1025, lng: 35.5061 },
  "מנרה": { name: "المنارة", lat: 33.2486, lng: 35.5322 },
  "מלכיה": { name: "ملكية", lat: 33.0858, lng: 35.4672 },
  "יראון": { name: "يرعون", lat: 33.0789, lng: 35.4456 },
  "דפנה": { name: "دفنا", lat: 33.2267, lng: 35.6400 },
  "דן": { name: "دان", lat: 33.2492, lng: 35.6519 },
  "הגושרים": { name: "هغوشريم", lat: 33.2261, lng: 35.6156 },
  "גולן": { name: "الجولان", lat: 33.0000, lng: 35.7500 },
  "צפת": { name: "صفد", lat: 32.9646, lng: 35.4964 },
  "עכו": { name: "عكا", lat: 32.9280, lng: 35.0764 },
  "חיפה": { name: "حيفا", lat: 32.7940, lng: 34.9896 },
  "גליל עליון": { name: "الجليل الأعلى", lat: 33.0500, lng: 35.5000 },
  "כרמיאל": { name: "كرميئيل", lat: 32.9136, lng: 35.3061 },
  "מעלות": { name: "معالوت", lat: 33.0167, lng: 35.2719 },
  "טבריה": { name: "طبريا", lat: 32.7922, lng: 35.5312 },
  "חצור הגלילית": { name: "حتسور", lat: 32.9847, lng: 35.5403 },
  "עמיעד": { name: "عميعاد", lat: 32.9253, lng: 35.5569 },
  "כפר ורדים": { name: "كفار فراديم", lat: 32.9986, lng: 35.2764 },
  "אילון": { name: "أيلون", lat: 33.0567, lng: 35.2408 },
  "אבן מנחם": { name: "إيفن مناحم", lat: 33.0533, lng: 35.3500 },
  "דישון": { name: "ديشون", lat: 33.0978, lng: 35.4494 },
};

const FALLBACK_AREA = { name: "شمال فلسطين المحتلة", lat: 33.05, lng: 35.45 };

function findArea(israeliArea: string): { name: string; lat: number; lng: number } {
  if (AREA_MAPPING[israeliArea]) return AREA_MAPPING[israeliArea];
  const lower = israeliArea.toLowerCase().trim();
  for (const [key, value] of Object.entries(AREA_MAPPING)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return value;
    }
  }
  return FALLBACK_AREA;
}

// ====== أنماط رسائل الإنذار ======
const RED_ALERT_PATTERNS = [
  /צבע אדום/i,         // צבע אדום (اللون الأحمر)
  /🚨.*אדום/i,          // 🚨 ... أدوم
  /🔴.*אזעקה/i,         // 🔴 إنذار
  /אזעקת.*טילים/i,     // إنذار صواريخ
  /ירי רקטות/i,         // إطلاق صواريخ
  /חדירת כלי טיס/i,    // اختراق طائرة
  /red alert/i,
  /rocket.*alert/i,
  /incoming.*rocket/i,
  /צבע\.?\s*אדום/i,
];

function isRedAlertMessage(text: string): boolean {
  return RED_ALERT_PATTERNS.some((pattern) => pattern.test(text));
}

function extractAreas(text: string): string[] {
  // Try to extract area names after common delimiters
  // Format: "צבע אדום: קריית שמונה, מטולה"
  // Format: "🚨 צבע אדום 🚨\nקריית שמונה\nמטולה"
  // Format: "Red Alert: Kiryat Shmona, Metula"

  const areas: string[] = [];

  // Try colon-separated
  const colonMatch = text.match(/[:：]\s*([\s\S]+)/);
  if (colonMatch) {
    const afterColon = colonMatch[1];
    // Split by comma, newline, or pipe
    const parts = afterColon.split(/[,،|\n]/).map((s) => s.trim()).filter(Boolean);
    areas.push(...parts);
  }

  // If no colon match, try to find known area names directly
  if (areas.length === 0) {
    for (const hebrewName of Object.keys(AREA_MAPPING)) {
      if (text.includes(hebrewName)) {
        areas.push(hebrewName);
      }
    }
  }

  // Clean up: remove emojis and extra whitespace
  return areas
    .map((a) => a.replace(/[🚨🔴⚠️🗺️📍✅❌⭐🔥💥🚁🚗🚑⏳♡]/g, "").trim())
    .filter((a) => a.length > 1);
}

function toArabic(name: string): string {
  return HEBREW_TO_ARABIC[name] || name;
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Telegram sends updates with message or channel_post
    const message = update.message || update.channel_post;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const text: string = message.text;

    // Only process red alert messages
    if (!isRedAlertMessage(text)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Extract Israeli area names from the message
    const israeliAreas = extractAreas(text);
    if (israeliAreas.length === 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: "no areas found" });
    }

    // Translate to Arabic and get coordinates
    const alertAreas: { name: string; lat: number; lng: number }[] = [];
    const seenNames = new Set<string>();

    for (const area of israeliAreas) {
      const mapped = findArea(area);
      if (!seenNames.has(mapped.name)) {
        seenNames.add(mapped.name);
        alertAreas.push(mapped);
      }
    }

    // Create alerts in Supabase at the actual Israeli locations
    const rows = alertAreas.map((area) => ({
      title: "🚨 صافرات إنذار",
      area: area.name,
      type: "siren",
      type_label: "🚨 صافرات إنذار",
      color: "#EF4444",
      description: `صافرات إنذار في ${area.name}. يرجى أخذ الحيطة والحذر.`,
      lat: area.lat,
      lng: area.lng,
      radius: 1500,
      expires_at: new Date(Date.now() + 60 * 60000).toISOString(),
      status: "active",
      is_urgent: true,
    }));

    const { error } = await supabaseAdmin.from("alerts").insert(rows);

    if (error) {
      console.error("خطأ في إدخال التنبيهات:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Forward to our own Telegram channel
    if (BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
      const notifText =
        `🚨 صافرات إنذار 🚨\n\n` +
        `📍 المنطقة: ${alertAreas.map((a) => a.name).join("، ")}\n\n` +
        `⚠️ يرجى أخذ الحيطة والحذر\n\n` +
        `#صافرات_إنذار #البيان`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHANNEL_ID,
          text: notifText,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      created: rows.length,
      areas: alertAreas.map((a) => a.name),
    });
  } catch (error) {
    console.error("خطأ في معالجة التحديث:", error);
    return NextResponse.json({ ok: true });
  }
}