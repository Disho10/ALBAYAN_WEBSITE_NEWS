import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-server";

const WEBHOOK_SECRET = process.env.TZOFAR_WEBHOOK_SECRET;

// Israeli siren areas — marked at their actual Israeli coordinates
const BORDER_MAPPING: Record<string, { name: string; lat: number; lng: number }[]> = {
  "נהריה": [{ name: "نهاريا", lat: 33.0061, lng: 35.0986 }],
  "nahariya": [{ name: "نهاريا", lat: 33.0061, lng: 35.0986 }],
  "نهاريا": [{ name: "نهاريا", lat: 33.0061, lng: 35.0986 }],
  "نهريا": [{ name: "نهاريا", lat: 33.0061, lng: 35.0986 }],

  "שלומי": [{ name: "شلومي", lat: 33.0747, lng: 35.1417 }],
  "shlomi": [{ name: "شلومي", lat: 33.0747, lng: 35.1417 }],
  "شلومي": [{ name: "شلومي", lat: 33.0747, lng: 35.1417 }],

  "קריית שמונה": [{ name: "كريات شمونة", lat: 33.2073, lng: 35.5713 }],
  "kiryat shmona": [{ name: "كريات شمونة", lat: 33.2073, lng: 35.5713 }],
  "كريات شمونة": [{ name: "كريات شمونة", lat: 33.2073, lng: 35.5713 }],
  "كريات شمونا": [{ name: "كريات شمونة", lat: 33.2073, lng: 35.5713 }],

  "מטולה": [{ name: "المطلة", lat: 33.2778, lng: 35.5731 }],
  "metula": [{ name: "المطلة", lat: 33.2778, lng: 35.5731 }],
  "المطلة": [{ name: "المطلة", lat: 33.2778, lng: 35.5731 }],
  "مطولا": [{ name: "المطلة", lat: 33.2778, lng: 35.5731 }],

  "דובב": [{ name: "دوفيف", lat: 33.0631, lng: 35.4214 }],
  "dovev": [{ name: "دوفيف", lat: 33.0631, lng: 35.4214 }],
  "دوفيف": [{ name: "دوفيف", lat: 33.0631, lng: 35.4214 }],

  "אבירים": [{ name: "أفيفيم", lat: 33.0547, lng: 35.4022 }],
  "avivim": [{ name: "أفيفيم", lat: 33.0547, lng: 35.4022 }],
  "أفيفيم": [{ name: "أفيفيم", lat: 33.0547, lng: 35.4022 }],

  "מרגליות": [{ name: "مرغليوت", lat: 33.2389, lng: 35.5589 }],
  "margaliot": [{ name: "مرغليوت", lat: 33.2389, lng: 35.5589 }],
  "مرغليوت": [{ name: "مرغليوت", lat: 33.2389, lng: 35.5589 }],

  "יפתח": [{ name: "يفتاح", lat: 33.1192, lng: 35.5008 }],
  "yiftah": [{ name: "يفتاح", lat: 33.1192, lng: 35.5008 }],
  "يفتاح": [{ name: "يفتاح", lat: 33.1192, lng: 35.5008 }],

  "מנרה": [{ name: "المنارة", lat: 33.2325, lng: 35.5261 }],
  "manara": [{ name: "المنارة", lat: 33.2325, lng: 35.5261 }],
  "المنارة": [{ name: "المنارة", lat: 33.2325, lng: 35.5261 }],

  "חניתה": [{ name: "حنيتا", lat: 33.1028, lng: 35.1994 }],
  "hanita": [{ name: "حنيتا", lat: 33.1028, lng: 35.1994 }],
  "حنيتا": [{ name: "حنيتا", lat: 33.1028, lng: 35.1994 }],

  "גליל עליון": [{ name: "الجليل الأعلى", lat: 33.15, lng: 35.5 }],
  "upper galilee": [{ name: "الجليل الأعلى", lat: 33.15, lng: 35.5 }],
  "الجليل الأعلى": [{ name: "الجليل الأعلى", lat: 33.15, lng: 35.5 }],

  "גולן": [{ name: "الجولان", lat: 33.0, lng: 35.77 }],
  "golan": [{ name: "الجولان", lat: 33.0, lng: 35.77 }],
  "الجولان": [{ name: "الجولان", lat: 33.0, lng: 35.77 }],

  "צפת": [{ name: "صفد", lat: 32.9646, lng: 35.4964 }],
  "safed": [{ name: "صفد", lat: 32.9646, lng: 35.4964 }],
  "صفد": [{ name: "صفد", lat: 32.9646, lng: 35.4964 }],

  "עכו": [{ name: "عكا", lat: 32.928, lng: 35.0764 }],
  "acre": [{ name: "عكا", lat: 32.928, lng: 35.0764 }],
  "عكا": [{ name: "عكا", lat: 32.928, lng: 35.0764 }],

  "חיפה": [{ name: "حيفا", lat: 32.794, lng: 34.9896 }],
  "haifa": [{ name: "حيفا", lat: 32.794, lng: 34.9896 }],
  "حيفا": [{ name: "حيفا", lat: 32.794, lng: 34.9896 }],

  "מסגב עם": [{ name: "مسغاف عام", lat: 33.0797, lng: 35.5244 }],
  "مسغاف عام": [{ name: "مسغاف عام", lat: 33.0797, lng: 35.5244 }],

  "תל אביב": [{ name: "تل أبيب", lat: 32.0853, lng: 34.7818 }],
  "tel aviv": [{ name: "تل أبيب", lat: 32.0853, lng: 34.7818 }],
  "تل أبيب": [{ name: "تل أبيب", lat: 32.0853, lng: 34.7818 }],

  "ירושלים": [{ name: "القدس", lat: 31.7683, lng: 35.2137 }],
  "jerusalem": [{ name: "القدس", lat: 31.7683, lng: 35.2137 }],
  "القدس": [{ name: "القدس", lat: 31.7683, lng: 35.2137 }],

  "באר שבע": [{ name: "بئر السبع", lat: 31.2518, lng: 34.7913 }],
  "beersheba": [{ name: "بئر السبع", lat: 31.2518, lng: 34.7913 }],
  "بئر السبع": [{ name: "بئر السبع", lat: 31.2518, lng: 34.7913 }],
};

// Fallback for unknown areas — center of northern Israel
const BORDER_FALLBACK = [
  { name: "شمال إسرائيل", lat: 33.1, lng: 35.4 },
];

// ترجمة أسماء المناطق الإسرائيلية للعربية
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
  "מסגב עם": "مسغاف عام",
  "תל אביב": "تل أبيب",
  "ירושלים": "القدس",
  "באר שבע": "بئر السبع",
};

function toArabic(name: string): string {
  return HEBREW_TO_ARABIC[name] || name;
}

function findLebaneseAreas(israeliArea: string): { name: string; lat: number; lng: number }[] {
  const lower = israeliArea.toLowerCase().trim();
  if (BORDER_MAPPING[israeliArea]) return BORDER_MAPPING[israeliArea];
  if (BORDER_MAPPING[lower]) return BORDER_MAPPING[lower];

  for (const [key, value] of Object.entries(BORDER_MAPPING)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return value;
    }
  }
  return BORDER_FALLBACK;
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();

    let israeliAreas: string[] = [];

    if (body.areas && Array.isArray(body.areas)) {
      israeliAreas = body.areas;
    } else if (body.message) {
      const msg = body.message as string;
      const match = msg.match(/[:：]\s*(.+)/);
      if (match) {
        israeliAreas = match[1].split(/[,،]/).map((s: string) => s.trim()).filter(Boolean);
      }
    } else if (body.area) {
      israeliAreas = [body.area];
    }

    if (israeliAreas.length === 0) {
      return NextResponse.json({ error: "لم يتم العثور على مناطق في الطلب" }, { status: 400 });
    }

    // ترجمة أسماء المناطق الإسرائيلية للعربية
    const arabicAreaNames = israeliAreas.map(toArabic);

    const allLebaneseAreas: { name: string; lat: number; lng: number }[] = [];
    const seenNames = new Set<string>();

    for (const area of israeliAreas) {
      const mapped = findLebaneseAreas(area);
      for (const leb of mapped) {
        if (!seenNames.has(leb.name)) {
          seenNames.add(leb.name);
          allLebaneseAreas.push(leb);
        }
      }
    }

    const rows = allLebaneseAreas.map((area) => ({
      title: "⚠️ تهديد — صافرات إنذار",
      area: area.name,
      type: "threat",
      type_label: "⚠️ تهديد — صافرات إنذار",
      color: "#F59E0B",
      description: `صافرات إنذار في إسرائيل: ${arabicAreaNames.join("، ")}. يرجى أخذ الحيطة والحذر.`,
      lat: area.lat,
      lng: area.lng,
      radius: 1200,
      expires_at: new Date(Date.now() + 60 * 60000).toISOString(),
      status: "active",
      is_urgent: true,
    }));

    const { error } = await supabaseAdmin.from("alerts").insert(rows);

    if (error) {
      console.error("خطأ في إدخال البيانات:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      created: rows.length,
      areas: allLebaneseAreas.map((a) => a.name),
      source_areas: arabicAreaNames,
    });
  } catch (error) {
    console.error("خطأ في webhook:", error);
    return NextResponse.json({ error: "خطأ داخلي في الخادم" }, { status: 500 });
  }
}
