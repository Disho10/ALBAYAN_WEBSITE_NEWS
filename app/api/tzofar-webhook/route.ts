import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-server";

const WEBHOOK_SECRET = process.env.TZOFAR_WEBHOOK_SECRET;

// Israeli border areas → nearest Lebanese areas
// Keys in Hebrew, English, and Arabic for flexible matching
const BORDER_MAPPING: Record<string, { name: string; lat: number; lng: number }[]> = {
  // نهاريا / الجليل الغربي → الناقورة
  "נהריה": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "nahariya": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "نهاريا": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "שלומי": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "shlomi": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "شلومي": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],

  // كريات شمونة → كفركلا / عيترون
  "קריית שמונה": [
    { name: "كفركلا", lat: 33.175, lng: 35.555 },
    { name: "عيترون", lat: 33.185, lng: 35.505 },
  ],
  "kiryat shmona": [
    { name: "كفركلا", lat: 33.175, lng: 35.555 },
    { name: "عيترون", lat: 33.185, lng: 35.505 },
  ],
  "كريات شمونة": [
    { name: "كفركلا", lat: 33.175, lng: 35.555 },
    { name: "عيترون", lat: 33.185, lng: 35.505 },
  ],

  // المطلة → كفركلا / العديسة
  "מטולה": [
    { name: "كفركلا", lat: 33.175, lng: 35.555 },
    { name: "العديسة", lat: 33.18, lng: 35.575 },
  ],
  "metula": [
    { name: "كفركلا", lat: 33.175, lng: 35.555 },
    { name: "العديسة", lat: 33.18, lng: 35.575 },
  ],
  "المطلة": [
    { name: "كفركلا", lat: 33.175, lng: 35.555 },
    { name: "العديسة", lat: 33.18, lng: 35.575 },
  ],

  // دوفيف / أفيفيم → بنت جبيل / عيتا الشعب
  "דובב": [{ name: "بنت جبيل", lat: 33.1215, lng: 35.4309 }],
  "dovev": [{ name: "بنت جبيل", lat: 33.1215, lng: 35.4309 }],
  "دوفيف": [{ name: "بنت جبيل", lat: 33.1215, lng: 35.4309 }],
  "אבירים": [{ name: "عيتا الشعب", lat: 33.11, lng: 35.42 }],
  "avivim": [{ name: "عيتا الشعب", lat: 33.11, lng: 35.42 }],
  "أفيفيم": [{ name: "عيتا الشعب", lat: 33.11, lng: 35.42 }],

  // مرغليوت → حولا / مركبا
  "מרגליות": [
    { name: "حولا", lat: 33.175, lng: 35.51 },
    { name: "مركبا", lat: 33.155, lng: 35.49 },
  ],
  "margaliot": [
    { name: "حولا", lat: 33.175, lng: 35.51 },
    { name: "مركبا", lat: 33.155, lng: 35.49 },
  ],
  "مرغليوت": [
    { name: "حولا", lat: 33.175, lng: 35.51 },
    { name: "مركبا", lat: 33.155, lng: 35.49 },
  ],

  // يفتاح → الخيام
  "יפתח": [{ name: "الخيام", lat: 33.215, lng: 35.555 }],
  "yiftah": [{ name: "الخيام", lat: 33.215, lng: 35.555 }],
  "يفتاح": [{ name: "الخيام", lat: 33.215, lng: 35.555 }],

  // المنارة → بليدا
  "מנרה": [{ name: "بليدا", lat: 33.168, lng: 35.547 }],
  "manara": [{ name: "بليدا", lat: 33.168, lng: 35.547 }],
  "المنارة": [{ name: "بليدا", lat: 33.168, lng: 35.547 }],

  // حنيتا → علمة الشعب
  "חניתה": [{ name: "علمة الشعب", lat: 33.1, lng: 35.2 }],
  "hanita": [{ name: "علمة الشعب", lat: 33.1, lng: 35.2 }],
  "حنيتا": [{ name: "علمة الشعب", lat: 33.1, lng: 35.2 }],

  // الجليل الأعلى → بنت جبيل / مارون الراس
  "גליל עליון": [
    { name: "بنت جبيل", lat: 33.1215, lng: 35.4309 },
    { name: "مارون الراس", lat: 33.1, lng: 35.46 },
  ],
  "upper galilee": [
    { name: "بنت جبيل", lat: 33.1215, lng: 35.4309 },
    { name: "مارون الراس", lat: 33.1, lng: 35.46 },
  ],
  "الجليل الأعلى": [
    { name: "بنت جبيل", lat: 33.1215, lng: 35.4309 },
    { name: "مارون الراس", lat: 33.1, lng: 35.46 },
  ],

  // الجولان → حاصبيا / شبعا
  "גולן": [
    { name: "حاصبيا", lat: 33.395, lng: 35.685 },
    { name: "شبعا", lat: 33.345, lng: 35.685 },
  ],
  "golan": [
    { name: "حاصبيا", lat: 33.395, lng: 35.685 },
    { name: "شبعا", lat: 33.345, lng: 35.685 },
  ],
  "الجولان": [
    { name: "حاصبيا", lat: 33.395, lng: 35.685 },
    { name: "شبعا", lat: 33.345, lng: 35.685 },
  ],

  // صفد → مرجعيون / الخيام
  "צפת": [
    { name: "مرجعيون", lat: 33.36, lng: 35.59 },
    { name: "الخيام", lat: 33.215, lng: 35.555 },
  ],
  "safed": [
    { name: "مرجعيون", lat: 33.36, lng: 35.59 },
    { name: "الخيام", lat: 33.215, lng: 35.555 },
  ],
  "صفد": [
    { name: "مرجعيون", lat: 33.36, lng: 35.59 },
    { name: "الخيام", lat: 33.215, lng: 35.555 },
  ],

  // عكا → الناقورة
  "עכו": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "acre": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],
  "عكا": [{ name: "الناقورة", lat: 33.1025, lng: 35.1375 }],

  // حيفا → صور (بعيد نسبيًا لكن إنذار عام)
  "חיפה": [{ name: "صور", lat: 33.27, lng: 35.2 }],
  "haifa": [{ name: "صور", lat: 33.27, lng: 35.2 }],
  "حيفا": [{ name: "صور", lat: 33.27, lng: 35.2 }],
};

// تراجع عام للمناطق غير المعروفة
const BORDER_FALLBACK = [
  { name: "المنطقة الحدودية الجنوبية", lat: 33.15, lng: 35.4 },
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
      console.error("خطأ في إدخال البيانات:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      created: rows.length,
      areas_lebanon: allLebaneseAreas.map((a) => a.name),
      source_areas: arabicAreaNames,
    });
  } catch (error) {
    console.error("خطأ في webhook:", error);
    return NextResponse.json({ error: "خطأ داخلي في الخادم" }, { status: 500 });
  }
}
