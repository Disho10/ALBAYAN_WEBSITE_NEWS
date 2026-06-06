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

// ====== ربط المناطق الإسرائيلية بالبلدات اللبنانية القريبة ======
const BORDER_MAPPING: Record<string, { name: string; lat: number; lng: number }[]> = {
  "נהריה": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "שלומי": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "ראש הנקרה": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "זרעית": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "שתולה": [{ name: "علمة الشعب", lat: 33.1, lng: 35.2 }],
  "חניתה": [{ name: "علمة الشعب", lat: 33.1, lng: 35.2 }],
  "בצת": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "קריית שמונה": [{ name: "كفركلا", lat: 33.175, lng: 35.555 }, { name: "عيترون", lat: 33.185, lng: 35.505 }],
  "שדה נחמיה": [{ name: "كفركلا", lat: 33.175, lng: 35.555 }],
  "כפר גלעדי": [{ name: "كفركلا", lat: 33.175, lng: 35.555 }],
  "תל חי": [{ name: "كفركلا", lat: 33.175, lng: 35.555 }],
  "מטולה": [{ name: "كفركلا", lat: 33.175, lng: 35.555 }, { name: "العديسة", lat: 33.18, lng: 35.575 }],
  "מישגב עם": [{ name: "حولا", lat: 33.175, lng: 35.51 }],
  "דובב": [{ name: "بنت جبيل", lat: 33.1215, lng: 35.4309 }],
  "אבירים": [{ name: "عيتا الشعب", lat: 33.11, lng: 35.42 }],
  "מרגליות": [{ name: "حولا", lat: 33.175, lng: 35.51 }, { name: "مركبا", lat: 33.155, lng: 35.49 }],
  "יפתח": [{ name: "الخيام", lat: 33.215, lng: 35.555 }],
  "רמות נפתלי": [{ name: "الخيام", lat: 33.215, lng: 35.555 }],
  "מנרה": [{ name: "بليدا", lat: 33.168, lng: 35.547 }],
  "מלכיה": [{ name: "مارون الراس", lat: 33.1, lng: 35.46 }],
  "יראון": [{ name: "مارون الراس", lat: 33.1, lng: 35.46 }],
  "דפנה": [{ name: "كفركلا", lat: 33.175, lng: 35.555 }],
  "דן": [{ name: "كفركلا", lat: 33.175, lng: 35.555 }],
  "הגושרים": [{ name: "كفركلا", lat: 33.175, lng: 35.555 }],
  "גולן": [{ name: "حاصبيا", lat: 33.395, lng: 35.685 }, { name: "شبعا", lat: 33.345, lng: 35.685 }],
  "צפת": [{ name: "مرجعيون", lat: 33.36, lng: 35.59 }],
  "עכו": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "חיפה": [{ name: "صور", lat: 33.27, lng: 35.2 }],
  "גליל עליון": [{ name: "بنت جبيل", lat: 33.1215, lng: 35.4309 }, { name: "مارون الراس", lat: 33.1, lng: 35.46 }],
};

const BORDER_FALLBACK = [{ name: "المنطقة الحدودية الجنوبية", lat: 33.15, lng: 35.4 }];

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
    for (const hebrewName of Object.keys(BORDER_MAPPING)) {
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

function findLebaneseAreas(area: string): { name: string; lat: number; lng: number }[] {
  if (BORDER_MAPPING[area]) return BORDER_MAPPING[area];
  const lower = area.toLowerCase().trim();
  for (const [key, value] of Object.entries(BORDER_MAPPING)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return value;
    }
  }
  return BORDER_FALLBACK;
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

    // Translate to Arabic
    const arabicAreaNames = israeliAreas.map(toArabic);

    // Map to Lebanese border areas
    const allLebaneseAreas: { name: string; lat: number; lng: number }[] = [];
    const seenNames = new Set<string>();

    for (const area of israeliAreas) {
      for (const leb of findLebaneseAreas(area)) {
        if (!seenNames.has(leb.name)) {
          seenNames.add(leb.name);
          allLebaneseAreas.push(leb);
        }
      }
    }

    // Create alerts in Supabase
    const rows = allLebaneseAreas.map((area) => ({
      title: "⚠️ تهديد — صافرات إنذار",
      area: area.name,
      type: "threat",
      type_label: "⚠️ تهديد — صافرات إنذار",
      color: "#F59E0B",
      description: `صافرات إنذار في: ${arabicAreaNames.join("، ")}. المنطقة المقابلة للحدود اللبنانية. يرجى أخذ الحيطة والحذر.`,
      lat: area.lat,
      lng: area.lng,
      radius: 1200,
      expires_at: new Date(Date.now() + 60 * 60000).toISOString(),
      status: "active",
      is_urgent: true,
    }));

    const { error } = await supabaseAdmin.from("alerts").insert(rows);

    if (error) {
      console.error("خطأ في إدخال التنبيهات:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Forward to our own Telegram channel (optional)
    if (BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
      const notifText =
        `🚨 صافرات إنذار 🚨\n\n` +
        `📍 المنطقة: ${arabicAreaNames.join("، ")}\n` +
        `🗺️ المناطق اللبنانية المتأثرة: ${allLebaneseAreas.map((a) => a.name).join("، ")}\n\n` +
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
      areas: allLebaneseAreas.map((a) => a.name),
    });
  } catch (error) {
    console.error("خطأ في معالجة التحديث:", error);
    return NextResponse.json({ ok: true });
  }
}
