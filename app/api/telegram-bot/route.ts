import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Israeli areas with actual coordinates and Arabic names
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
  "דישון": { name: "ديشون", lat: 33.0978, lng: 35.4494 },
  "אילון": { name: "أيلون", lat: 33.0567, lng: 35.2408 },
  "אבן מנחם": { name: "إيفن مناحم", lat: 33.0533, lng: 35.3500 },
  "צפת": { name: "صفد", lat: 32.9646, lng: 35.4964 },
  "עכו": { name: "عكا", lat: 32.9280, lng: 35.0764 },
  "טבריה": { name: "طبريا", lat: 32.7922, lng: 35.5312 },
  "כרמיאל": { name: "كرميئيل", lat: 32.9136, lng: 35.3061 },
  "מעלות": { name: "معالوت", lat: 33.0167, lng: 35.2719 },
  "חצור הגלילית": { name: "حتسور", lat: 32.9847, lng: 35.5403 },
  "כפר ורדים": { name: "كفار فراديم", lat: 32.9986, lng: 35.2764 },
  "חיפה": { name: "حيفا", lat: 32.7940, lng: 34.9896 },
  "נצרת": { name: "الناصرة", lat: 32.6996, lng: 35.3035 },
  "נוף הגליל": { name: "نوف هجليل", lat: 32.7270, lng: 35.3215 },
  "עפולה": { name: "العفولة", lat: 32.6063, lng: 35.2893 },
  "בית שאן": { name: "بيسان", lat: 32.4971, lng: 35.4967 },
  "שפרעם": { name: "شفاعمرو", lat: 32.8053, lng: 35.1692 },
  "מג'דל שמס": { name: "مجدل شمس", lat: 33.2710, lng: 35.7700 },
  "חדרה": { name: "الخضيرة", lat: 32.4341, lng: 34.9196 },
  "עתלית": { name: "عتليت", lat: 32.6873, lng: 34.9404 },
  "טירת כרמל": { name: "طيرة الكرمل", lat: 32.7600, lng: 34.9700 },
  "נשר": { name: "نيشر", lat: 32.7700, lng: 35.0400 },
  "קרית אתא": { name: "كريات آتا", lat: 32.8100, lng: 35.1000 },
  "קרית ביאליק": { name: "كريات بياليك", lat: 32.8300, lng: 35.0800 },
  "קרית מוצקין": { name: "كريات موتسكين", lat: 32.8400, lng: 35.0700 },
  "קרית ים": { name: "كريات يام", lat: 32.8500, lng: 35.0600 },
  "תל אביב": { name: "تل أبيب", lat: 32.0853, lng: 34.7818 },
  "נתניה": { name: "نتانيا", lat: 32.3215, lng: 34.8532 },
  "הרצליה": { name: "هرتسليا", lat: 32.1624, lng: 34.7916 },
  "רמת גן": { name: "رمات غان", lat: 32.0680, lng: 34.8237 },
  "בני ברק": { name: "بني براك", lat: 32.0831, lng: 34.8344 },
  "פתח תקווה": { name: "بتاح تكفا", lat: 32.0841, lng: 34.8878 },
  "ראשון לציון": { name: "ريشون لتسيون", lat: 31.9730, lng: 34.7925 },
  "רחובות": { name: "رحوفوت", lat: 31.8928, lng: 34.8113 },
  "אשדוד": { name: "أشدود", lat: 31.8014, lng: 34.6503 },
  "אשקלון": { name: "عسقلان", lat: 31.6658, lng: 34.5715 },
  "ירושלים": { name: "القدس", lat: 31.7683, lng: 35.2137 },
  "לוד": { name: "اللد", lat: 31.9516, lng: 34.8953 },
  "רמלה": { name: "الرملة", lat: 31.9290, lng: 34.8706 },
  "כפר סבא": { name: "كفار سابا", lat: 32.1715, lng: 34.9073 },
  "רעננה": { name: "رعنانا", lat: 32.1841, lng: 34.8710 },
  "הוד השרון": { name: "هود هشارون", lat: 32.1540, lng: 34.8870 },
  "חולון": { name: "حولون", lat: 32.0117, lng: 34.7749 },
  "בת ים": { name: "بات يام", lat: 32.0167, lng: 34.7510 },
  "קצרין": { name: "كتسرين", lat: 32.9925, lng: 35.6917 },
  "גולן": { name: "الجولان", lat: 33.0000, lng: 35.7500 },
  "גליל עליון": { name: "الجليل الأعلى", lat: 33.0500, lng: 35.5000 },
  // English names
  "nahariya": { name: "نهاريا", lat: 33.0061, lng: 35.0986 },
  "kiryat shmona": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "metula": { name: "المطلة", lat: 33.2778, lng: 35.5731 },
  "safed": { name: "صفد", lat: 32.9646, lng: 35.4964 },
  "acre": { name: "عكا", lat: 32.9280, lng: 35.0764 },
  "haifa": { name: "حيفا", lat: 32.7940, lng: 34.9896 },
  "tiberias": { name: "طبريا", lat: 32.7922, lng: 35.5312 },
  "nazareth": { name: "الناصرة", lat: 32.6996, lng: 35.3035 },
  "tel aviv": { name: "تل أبيب", lat: 32.0853, lng: 34.7818 },
  "netanya": { name: "نتانيا", lat: 32.3215, lng: 34.8532 },
  "jerusalem": { name: "القدس", lat: 31.7683, lng: 35.2137 },
  "ashdod": { name: "أشدود", lat: 31.8014, lng: 34.6503 },
  "ashkelon": { name: "عسقلان", lat: 31.6658, lng: 34.5715 },
  "herzliya": { name: "هرتسليا", lat: 32.1624, lng: 34.7916 },
  "upper galilee": { name: "الجليل الأعلى", lat: 33.0500, lng: 35.5000 },
  "golan": { name: "الجولان", lat: 33.0000, lng: 35.7500 },
  "karmiel": { name: "كرميئيل", lat: 32.9136, lng: 35.3061 },
  "afula": { name: "العفولة", lat: 32.6063, lng: 35.2893 },
};

const FALLBACK_AREA = { name: "شمال فلسطين المحتلة", lat: 33.05, lng: 35.45 };

const RED_ALERT_PATTERNS = [
  /צבע אדום/i,
  /אזעקה/i,
  /אזעקת.*טילים/i,
  /ירי רקטות/i,
  /חדירת כלי טיס/i,
  /red alert/i,
  /rocket.*alert/i,
  /incoming.*rocket/i,
];

function isRedAlertMessage(text: string): boolean {
  return RED_ALERT_PATTERNS.some((p) => p.test(text));
}

function extractAreas(text: string): string[] {
  const areas: string[] = [];
  const colonMatch = text.match(/[:：]\s*([\s\S]+)/);
  if (colonMatch) {
    areas.push(...colonMatch[1].split(/[,،|\n]/).map((s) => s.trim()).filter(Boolean));
  }
  if (areas.length === 0) {
    for (const name of Object.keys(AREA_MAPPING)) {
      if (text.includes(name)) areas.push(name);
    }
  }
  return areas.map((a) => a.replace(/[🚨🔴⚠️]/g, "").trim()).filter((a) => a.length > 1);
}

function findArea(name: string): { name: string; lat: number; lng: number } {
  if (AREA_MAPPING[name]) return AREA_MAPPING[name];
  const lower = name.toLowerCase().trim();
  for (const [key, value] of Object.entries(AREA_MAPPING)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) return value;
  }
  return FALLBACK_AREA;
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update.message || update.channel_post;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const text: string = message.text;
    if (!isRedAlertMessage(text)) return NextResponse.json({ ok: true, skipped: true });

    const israeliAreas = extractAreas(text);
    if (israeliAreas.length === 0) return NextResponse.json({ ok: true, skipped: true });

    const alertAreas: { name: string; lat: number; lng: number }[] = [];
    const seen = new Set<string>();
    for (const area of israeliAreas) {
      const mapped = findArea(area);
      if (!seen.has(mapped.name)) { seen.add(mapped.name); alertAreas.push(mapped); }
    }

    const rows = alertAreas.map((area) => ({
      title: "🚨 صافرات إنذار",
      area: area.name,
      type: "siren",
      type_label: "🚨 صافرات إنذار",
      color: "#EF4444",
      description: `صافرات إنذار في ${area.name}. يرجى أخذ الحيطة والحذر.`,
      lat: area.lat, lng: area.lng,
      radius: 1500,
      expires_at: new Date(Date.now() + 60 * 60000).toISOString(),
      status: "active",
      is_urgent: true,
    }));

    const { error } = await supabaseAdmin.from("alerts").insert(rows);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    if (BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHANNEL_ID,
          text: `🚨 صافرات إنذار 🚨\n\n📍 ${alertAreas.map((a) => a.name).join("، ")}\n\n⚠️ يرجى أخذ الحيطة والحذر\n\n#صافرات_إنذار #البيان`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, created: rows.length, areas: alertAreas.map((a) => a.name) });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
