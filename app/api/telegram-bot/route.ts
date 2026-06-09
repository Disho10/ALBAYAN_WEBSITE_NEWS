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
  // ── NORTH — near Lebanese border (small radii so circles stay in Israel) ──

  // همفراتس = HaMifrats (Haifa Bay coastal strip)
  "همفراتس":           { name: "منطقة همفراتس",         lat: 32.84, lng: 35.06, radius: 5500 },

  // Upper Galilee — center pulled south of the border
  "الجليلالاعلى":      { name: "الجليل الأعلى",          lat: 32.97, lng: 35.32, radius: 7000 },

  // Lower Galilee
  "الجليلالاسفل":      { name: "الجليل الأسفل",          lat: 32.73, lng: 35.37, radius: 6000 },

  // Central Galilee
  "مركزالجليل":        { name: "مركز الجليل",            lat: 32.87, lng: 35.27, radius: 7000 },

  // Western Galilee
  "الجليلالغربي":      { name: "الجليل الغربي",          lat: 32.97, lng: 35.13, radius: 6000 },

  // Confrontation line — right on the border, kept small
  "خطالمواجهه":        { name: "خط المواجهة",            lat: 33.05, lng: 35.42, radius: 7000 },

  // ── GOLAN ──
  "الجولانالشمالي":    { name: "الجولان الشمالي",        lat: 33.08, lng: 35.76, radius: 7000 },
  "الجولانالجنوبي":    { name: "الجولان الجنوبي",        lat: 32.83, lng: 35.74, radius: 7000 },

  // ── HAIFA METRO ──
  "حيفا":              { name: "حيفا",                   lat: 32.80, lng: 34.99, radius: 4000 },

  // Carmel region (south of Haifa)
  "الكرمل":            { name: "منطقة الكرمل",           lat: 32.71, lng: 34.97, radius: 5500 },

  // ── NORTHERN VALLEYS ──
  "واديعاره":          { name: "منطقة وادي عارة",        lat: 32.47, lng: 35.08, radius: 5000 },
  "العمقيم":           { name: "منطقة الأودية",          lat: 32.62, lng: 35.18, radius: 6000 },
  "عمقيزرعيل":        { name: "وادي يزرعيل",            lat: 32.62, lng: 35.25, radius: 5500 },
  "كينيريت":           { name: "منطقة كينيريت",          lat: 32.80, lng: 35.55, radius: 5000 },
  "طبريا":             { name: "طبريا",                  lat: 32.80, lng: 35.53, radius: 3500 },

  // ── SHARON / CENTRAL COAST ──
  "الشارون":           { name: "منطقة الشارون",          lat: 32.35, lng: 34.92, radius: 7000 },
  "حدره":              { name: "منطقة حدرا",             lat: 32.43, lng: 34.92, radius: 4500 },
  "نتانيا":            { name: "نتانيا",                 lat: 32.32, lng: 34.85, radius: 4000 },

  // ── TEL AVIV METRO (גוש דן) ──
  "تلابيب":            { name: "تل أبيب",                lat: 32.08, lng: 34.78, radius: 3500 },
  "غوشدان":            { name: "منطقة غوش دان",          lat: 32.05, lng: 34.82, radius: 8000 },
  "رمات‌غان":          { name: "رامات غان",              lat: 32.07, lng: 34.82, radius: 3000 },
  "بتاحتكفا":          { name: "بتاح تكفا",              lat: 32.09, lng: 34.89, radius: 3500 },
  "ريشونلتسيون":       { name: "ريشون لتسيون",           lat: 31.96, lng: 34.80, radius: 3500 },
  "حولون":             { name: "حولون",                  lat: 32.01, lng: 34.77, radius: 3000 },
  "باتيام":            { name: "بات يام",                lat: 32.01, lng: 34.75, radius: 3000 },
  "المركز":            { name: "وسط البلاد",             lat: 32.08, lng: 34.85, radius: 9000 },
  "مركزالبلاد":        { name: "وسط البلاد",             lat: 32.08, lng: 34.85, radius: 9000 },

  // ── JERUSALEM ──
  "القدس":             { name: "القدس",                  lat: 31.77, lng: 35.21, radius: 5000 },
  "يهودا":             { name: "منطقة يهودا",            lat: 31.70, lng: 35.20, radius: 7000 },
  "المشهدالشمالي":     { name: "القدس الشمالية",         lat: 31.82, lng: 35.19, radius: 4000 },

  // ── LOWLANDS / SHFELA ──
  "الشفله":            { name: "منطقة الشفلة",           lat: 31.78, lng: 34.85, radius: 7000 },
  "بيتشيمش":          { name: "بيت شيمش",               lat: 31.75, lng: 35.00, radius: 4000 },
  "مودعين":            { name: "منطقة مودعين",           lat: 31.90, lng: 34.97, radius: 4500 },

  // ── SOUTH COAST ──
  "عسقلان":            { name: "عسقلان",                 lat: 31.67, lng: 34.57, radius: 4000 },
  "اشدود":             { name: "أشدود",                  lat: 31.80, lng: 34.65, radius: 4000 },

  // ── GAZA ENVELOPE ──
  "غلافغزه":           { name: "غلاف غزة",               lat: 31.44, lng: 34.60, radius: 6000 },
  "اشكول":             { name: "منطقة إشكول",            lat: 31.30, lng: 34.50, radius: 5500 },

  // ── NEGEV / SOUTH ──
  "الجنوب":            { name: "منطقة الجنوب",           lat: 31.25, lng: 34.79, radius: 12000 },
  "النقب":             { name: "النقب",                  lat: 31.25, lng: 34.79, radius: 12000 },
  "بيرالسبع":          { name: "بئر السبع",              lat: 31.25, lng: 34.79, radius: 5000 },
  "ديمونا":            { name: "ديمونا",                 lat: 31.07, lng: 35.03, radius: 3500 },
  "ايلات":             { name: "إيلات",                  lat: 29.56, lng: 34.95, radius: 4000 },

  // ── SECTIONS FROM END MESSAGES (no existing alerts but needed for clearing) ──
  "مناشيه":            { name: "منطقة مناشيه",           lat: 32.52, lng: 35.00, radius: 5500 },
  "دان":               { name: "منطقة الدان",            lat: 32.06, lng: 34.87, radius: 5000 },
  "باكعا":             { name: "منطقة البقاع",           lat: 32.50, lng: 35.47, radius: 7000 },
  "شيفلاتيهودا":       { name: "شفلة يهودا",             lat: 31.75, lng: 34.97, radius: 6000 },
  "الساحل":            { name: "المنطقة الساحلية",       lat: 32.10, lng: 34.75, radius: 7000 },
  "يركون":             { name: "منطقة اليركون",          lat: 32.09, lng: 34.87, radius: 5000 },
  "لاخيش":             { name: "منطقة لاخيش",            lat: 31.57, lng: 34.85, radius: 5500 },
  "شومرون":            { name: "منطقة شومرون",           lat: 32.24, lng: 35.27, radius: 7000 },
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

/* ─── Israeli area mapping — comprehensive city database ─── */
const AREA_MAPPING: Record<string, { name: string; lat: number; lng: number }> = {
  // ═══ NORTHERN BORDER (Lebanon border) ═══
  "المطلة": { name: "المطلة", lat: 33.2778, lng: 35.5731 },
  "مطولا": { name: "المطلة", lat: 33.2778, lng: 35.5731 },
  "متولا": { name: "المطلة", lat: 33.2778, lng: 35.5731 },
  "كريات شمونة": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "كريات شمونا": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "كريات شمونه": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "قريات شمونة": { name: "كريات شمونة", lat: 33.2073, lng: 35.5713 },
  "كفار جلعادي": { name: "كفار جلعادي", lat: 33.2428, lng: 35.5683 },
  "كفر جلعادي": { name: "كفار جلعادي", lat: 33.2428, lng: 35.5683 },
  "كفار غلعادي": { name: "كفار جلعادي", lat: 33.2428, lng: 35.5683 },
  "سديه نحميا": { name: "سديه نحميا", lat: 33.2394, lng: 35.5592 },
  "تل حاي": { name: "تل حاي", lat: 33.2347, lng: 35.5689 },
  "مرغليوت": { name: "مرغليوت", lat: 33.2389, lng: 35.5589 },
  "مرجليوت": { name: "مرغليوت", lat: 33.2389, lng: 35.5589 },
  "المنارة": { name: "المنارة", lat: 33.2325, lng: 35.5261 },
  "دفنا": { name: "دفنا", lat: 33.2267, lng: 35.64 },
  "دان": { name: "دان", lat: 33.2492, lng: 35.6519 },
  "هغوشريم": { name: "هغوشريم", lat: 33.2261, lng: 35.6156 },
  "مسغاف عام": { name: "مسغاف عام", lat: 33.0797, lng: 35.5244 },
  "مسجاف عام": { name: "مسغاف عام", lat: 33.0797, lng: 35.5244 },
  "شلومي": { name: "شلومي", lat: 33.0747, lng: 35.1417 },
  "رأس الناقورة": { name: "رأس الناقورة", lat: 33.0893, lng: 35.1058 },
  "حنيتا": { name: "حنيتا", lat: 33.1028, lng: 35.1994 },
  "شتولا": { name: "شتولا", lat: 33.0775, lng: 35.2075 },
  "زرعيت": { name: "زرعيت", lat: 33.0822, lng: 35.1497 },
  "أفيفيم": { name: "أفيفيم", lat: 33.0547, lng: 35.4022 },
  "افيفيم": { name: "أفيفيم", lat: 33.0547, lng: 35.4022 },
  "دوفيف": { name: "دوفيف", lat: 33.0631, lng: 35.4214 },
  "دوفب": { name: "دوفيف", lat: 33.0631, lng: 35.4214 },
  "يفتاح": { name: "يفتاح", lat: 33.1192, lng: 35.5008 },
  "يفتح": { name: "يفتاح", lat: 33.1192, lng: 35.5008 },
  "ملكية": { name: "ملكية", lat: 33.0858, lng: 35.4672 },
  "ملخيا": { name: "ملكية", lat: 33.0858, lng: 35.4672 },
  "يرعون": { name: "يرعون", lat: 33.0789, lng: 35.4456 },
  "يرؤون": { name: "يرعون", lat: 33.0789, lng: 35.4456 },
  "ديشون": { name: "ديشون", lat: 33.0978, lng: 35.4494 },
  "راموت نفتالي": { name: "راموت نفتالي", lat: 33.1025, lng: 35.5061 },
  "راموت نافتالي": { name: "راموت نفتالي", lat: 33.1025, lng: 35.5061 },
  "رموت نفتالي": { name: "راموت نفتالي", lat: 33.1025, lng: 35.5061 },
  "بتسيت": { name: "بتسيت", lat: 33.0531, lng: 35.1608 },
  "أيلون": { name: "أيلون", lat: 33.0567, lng: 35.2408 },
  "ايلون": { name: "أيلون", lat: 33.0567, lng: 35.2408 },
  "إيفن مناحم": { name: "إيفن مناحم", lat: 33.0533, lng: 35.35 },
  "ايفن مناحم": { name: "إيفن مناحم", lat: 33.0533, lng: 35.35 },
  "برعام": { name: "برعام", lat: 33.0586, lng: 35.4417 },
  "سعسع": { name: "سعسع", lat: 33.025, lng: 35.3803 },
  "الجش": { name: "الجش", lat: 33.0336, lng: 35.4675 },
  "فسوطة": { name: "فسوطة", lat: 33.0475, lng: 35.3258 },
  "حورفيش": { name: "حورفيش", lat: 33.0167, lng: 35.35 },
  // ═══ UPPER GALILEE ═══
  "صفد": { name: "صفد", lat: 32.9646, lng: 35.4964 },
  "تسفات": { name: "صفد", lat: 32.9646, lng: 35.4964 },
  "حتسور": { name: "حتسور", lat: 32.9847, lng: 35.5403 },
  "حاتسور": { name: "حتسور", lat: 32.9847, lng: 35.5403 },
  "حتسور هجليلت": { name: "حتسور", lat: 32.9847, lng: 35.5403 },
  "روش بينا": { name: "روش بينا", lat: 32.9683, lng: 35.5433 },
  "عميعاد": { name: "عميعاد", lat: 32.9389, lng: 35.5506 },
  "ميرون": { name: "ميرون", lat: 32.9847, lng: 35.4419 },
  "بيريا": { name: "بيريا", lat: 32.9731, lng: 35.5036 },
  // ═══ WESTERN GALILEE ═══
  "نهاريا": { name: "نهاريا", lat: 33.0061, lng: 35.0986 },
  "نهريا": { name: "نهاريا", lat: 33.0061, lng: 35.0986 },
  "عكا": { name: "عكا", lat: 32.928, lng: 35.0764 },
  "عكو": { name: "عكا", lat: 32.928, lng: 35.0764 },
  "معالوت": { name: "معالوت", lat: 33.0167, lng: 35.2719 },
  "معالوت ترشيحا": { name: "معالوت", lat: 33.0167, lng: 35.2719 },
  "ترشيحا": { name: "معالوت", lat: 33.0167, lng: 35.2719 },
  "كابول": { name: "كابول", lat: 32.8703, lng: 35.2106 },
  "يركا": { name: "يركا", lat: 32.9536, lng: 35.1858 },
  "جولس": { name: "جولس", lat: 32.9503, lng: 35.1592 },
  "أبو سنان": { name: "أبو سنان", lat: 32.9558, lng: 35.1672 },
  "كفر ياسيف": { name: "كفر ياسيف", lat: 32.9531, lng: 35.1428 },
  "البقيعة": { name: "البقيعة", lat: 32.9742, lng: 35.3211 },
  // ═══ CENTRAL & LOWER GALILEE ═══
  "كرمئيل": { name: "كرمئيل", lat: 32.9138, lng: 35.2971 },
  "كرميئيل": { name: "كرمئيل", lat: 32.9138, lng: 35.2971 },
  "الناصرة": { name: "الناصرة", lat: 32.6996, lng: 35.3035 },
  "نتسيرت": { name: "الناصرة", lat: 32.6996, lng: 35.3035 },
  "نوف هجليل": { name: "نوف هجليل", lat: 32.727, lng: 35.3215 },
  "الناصرة العليا": { name: "نوف هجليل", lat: 32.727, lng: 35.3215 },
  "طبريا": { name: "طبريا", lat: 32.7957, lng: 35.5302 },
  "طبرية": { name: "طبريا", lat: 32.7957, lng: 35.5302 },
  "ساخنين": { name: "ساخنين", lat: 32.8628, lng: 35.2942 },
  "سخنين": { name: "ساخنين", lat: 32.8628, lng: 35.2942 },
  "عرابة": { name: "عرابة", lat: 32.855, lng: 35.335 },
  "دير حنا": { name: "دير حنا", lat: 32.865, lng: 35.355 },
  "شفاعمرو": { name: "شفاعمرو", lat: 32.8053, lng: 35.1692 },
  "طمرة": { name: "طمرة", lat: 32.8531, lng: 35.1975 },
  "المغار": { name: "المغار", lat: 32.8817, lng: 35.4261 },
  "كفر كنا": { name: "كفر كنا", lat: 32.7469, lng: 35.3428 },
  "الرينة": { name: "الرينة", lat: 32.7128, lng: 35.3258 },
  "عيلبون": { name: "عيلبون", lat: 32.8367, lng: 35.3853 },
  "طرعان": { name: "طرعان", lat: 32.7817, lng: 35.3317 },
  "عين ماهل": { name: "عين ماهل", lat: 32.7253, lng: 35.2953 },
  "مجد الكروم": { name: "مجد الكروم", lat: 32.9208, lng: 35.2439 },
  "العفولة": { name: "العفولة", lat: 32.6063, lng: 35.2893 },
  "عفولة": { name: "العفولة", lat: 32.6063, lng: 35.2893 },
  "بيسان": { name: "بيسان", lat: 32.4971, lng: 35.4967 },
  "بيت شان": { name: "بيسان", lat: 32.4971, lng: 35.4967 },
  "يوكنعام": { name: "يوكنعام", lat: 32.6594, lng: 35.1083 },
  // ═══ HAIFA & CARMEL ═══
  "حيفا": { name: "حيفا", lat: 32.794, lng: 34.9896 },
  "كريات آتا": { name: "كريات آتا", lat: 32.81, lng: 35.1 },
  "كريات اتا": { name: "كريات آتا", lat: 32.81, lng: 35.1 },
  "كريات بياليك": { name: "كريات بياليك", lat: 32.83, lng: 35.08 },
  "كريات موتسكين": { name: "كريات موتسكين", lat: 32.84, lng: 35.07 },
  "كريات يام": { name: "كريات يام", lat: 32.85, lng: 35.06 },
  "نيشر": { name: "نيشر", lat: 32.77, lng: 35.04 },
  "طيرة الكرمل": { name: "طيرة الكرمل", lat: 32.76, lng: 34.97 },
  "طيرات كرمل": { name: "طيرة الكرمل", lat: 32.76, lng: 34.97 },
  "عتليت": { name: "عتليت", lat: 32.6873, lng: 34.9404 },
  "دالية الكرمل": { name: "دالية الكرمل", lat: 32.695, lng: 35.04 },
  "عسفيا": { name: "عسفيا", lat: 32.72, lng: 35.05 },
  "أم الفحم": { name: "أم الفحم", lat: 32.5169, lng: 35.1536 },
  "ام الفحم": { name: "أم الفحم", lat: 32.5169, lng: 35.1536 },
  "باقة الغربية": { name: "باقة الغربية", lat: 32.4192, lng: 35.0378 },
  // ═══ GOLAN HEIGHTS ═══
  "الجولان": { name: "الجولان", lat: 33.0, lng: 35.77 },
  "كتسرين": { name: "كتسرين", lat: 32.9925, lng: 35.6917 },
  "قتسرين": { name: "كتسرين", lat: 32.9925, lng: 35.6917 },
  "مجدل شمس": { name: "مجدل شمس", lat: 33.271, lng: 35.77 },
  "مسعدة": { name: "مسعدة", lat: 33.235, lng: 35.75 },
  "بقعاتا": { name: "بقعاتا", lat: 33.22, lng: 35.76 },
  "عين قنية": { name: "عين قنية", lat: 33.25, lng: 35.78 },
  "الجليل": { name: "الجليل", lat: 32.9, lng: 35.3 },
  // ═══ SHARON / NORTH-CENTRAL COAST ═══
  "نتانيا": { name: "نتانيا", lat: 32.3215, lng: 34.8532 },
  "نتنيا": { name: "نتانيا", lat: 32.3215, lng: 34.8532 },
  "الخضيرة": { name: "الخضيرة", lat: 32.4341, lng: 34.9196 },
  "خضيرة": { name: "الخضيرة", lat: 32.4341, lng: 34.9196 },
  "حدرا": { name: "الخضيرة", lat: 32.4342, lng: 34.9199 },
  "حديرا": { name: "الخضيرة", lat: 32.4342, lng: 34.9199 },
  "هرتسليا": { name: "هرتسليا", lat: 32.1624, lng: 34.7916 },
  "هرتسيليا": { name: "هرتسليا", lat: 32.1624, lng: 34.7916 },
  "كفار سابا": { name: "كفار سابا", lat: 32.1715, lng: 34.9073 },
  "كفر سابا": { name: "كفار سابا", lat: 32.1715, lng: 34.9073 },
  "رعنانا": { name: "رعنانا", lat: 32.1841, lng: 34.871 },
  "رعننا": { name: "رعنانا", lat: 32.1841, lng: 34.871 },
  "هود هشارون": { name: "هود هشارون", lat: 32.154, lng: 34.887 },
  "رمات هشارون": { name: "رمات هشارون", lat: 32.1458, lng: 34.8392 },
  "بنيامينا": { name: "بنيامينا", lat: 32.5217, lng: 34.9453 },
  "أور عكيفا": { name: "أور عكيفا", lat: 32.5067, lng: 34.92 },
  "قيساريا": { name: "قيساريا", lat: 32.5031, lng: 34.8903 },
  "برديس حنا": { name: "برديس حنا", lat: 32.4728, lng: 34.9639 },
  "جسر الزرقاء": { name: "جسر الزرقاء", lat: 32.5339, lng: 34.9061 },
  "زخرون يعقوب": { name: "زخرون يعقوب", lat: 32.5714, lng: 34.9539 },
  "حريش": { name: "حريش", lat: 32.46, lng: 35.05 },
  "كفر قرع": { name: "كفر قرع", lat: 32.488, lng: 35.1 },
  "عرعرة": { name: "عرعرة", lat: 32.4975, lng: 35.0828 },
  // ═══ TEL AVIV METRO (GUSH DAN) ═══
  "تل أبيب": { name: "تل أبيب", lat: 32.0853, lng: 34.7818 },
  "تل ابيب": { name: "تل أبيب", lat: 32.0853, lng: 34.7818 },
  "رمات غان": { name: "رمات غان", lat: 32.068, lng: 34.8237 },
  "رمات جان": { name: "رمات غان", lat: 32.068, lng: 34.8237 },
  "بني براك": { name: "بني براك", lat: 32.0831, lng: 34.8344 },
  "بني برك": { name: "بني براك", lat: 32.0831, lng: 34.8344 },
  "بتاح تكفا": { name: "بتاح تكفا", lat: 32.0841, lng: 34.8878 },
  "بتح تكفا": { name: "بتاح تكفا", lat: 32.0841, lng: 34.8878 },
  "حولون": { name: "حولون", lat: 32.0117, lng: 34.7749 },
  "بات يام": { name: "بات يام", lat: 32.0167, lng: 34.751 },
  "ريشون لتسيون": { name: "ريشون لتسيون", lat: 31.973, lng: 34.7925 },
  "ريشون لتصيون": { name: "ريشون لتسيون", lat: 31.973, lng: 34.7925 },
  "رحوفوت": { name: "رحوفوت", lat: 31.8928, lng: 34.8113 },
  "رحوبوت": { name: "رحوفوت", lat: 31.8928, lng: 34.8113 },
  "اللد": { name: "اللد", lat: 31.9516, lng: 34.8953 },
  "لود": { name: "اللد", lat: 31.9516, lng: 34.8953 },
  "الرملة": { name: "الرملة", lat: 31.929, lng: 34.8706 },
  "رملة": { name: "الرملة", lat: 31.929, lng: 34.8706 },
  "يافا": { name: "يافا", lat: 32.0503, lng: 34.7597 },
  "جفعتايم": { name: "جفعتايم", lat: 32.07, lng: 34.81 },
  "موديعين": { name: "موديعين", lat: 31.8977, lng: 35.0102 },
  // ═══ JERUSALEM & CENTRAL HILLS ═══
  "القدس": { name: "القدس", lat: 31.7683, lng: 35.2137 },
  "بيت شيمش": { name: "بيت شيمش", lat: 31.7466, lng: 34.9886 },
  "بيت لحم": { name: "بيت لحم", lat: 31.7054, lng: 35.2024 },
  "رام الله": { name: "رام الله", lat: 31.9038, lng: 35.2034 },
  "معاليه أدوميم": { name: "معاليه أدوميم", lat: 31.7771, lng: 35.2956 },
  "أريحا": { name: "أريحا", lat: 31.8611, lng: 35.4606 },
  "اريحا": { name: "أريحا", lat: 31.8611, lng: 35.4606 },
  // ═══ SOUTH — NEGEV ═══
  "بئر السبع": { name: "بئر السبع", lat: 31.2518, lng: 34.7913 },
  "بير السبع": { name: "بئر السبع", lat: 31.2518, lng: 34.7913 },
  "بئر شيبع": { name: "بئر السبع", lat: 31.2518, lng: 34.7913 },
  "أشدود": { name: "أشدود", lat: 31.8044, lng: 34.6553 },
  "اشدود": { name: "أشدود", lat: 31.8044, lng: 34.6553 },
  "عسقلان": { name: "عسقلان", lat: 31.668, lng: 34.571 },
  "اشكلون": { name: "عسقلان", lat: 31.668, lng: 34.571 },
  "سديروت": { name: "سديروت", lat: 31.5247, lng: 34.5967 },
  "كريات جات": { name: "كريات جات", lat: 31.6089, lng: 34.7583 },
  "ديمونا": { name: "ديمونا", lat: 31.0697, lng: 35.0367 },
  "أراد": { name: "أراد", lat: 31.2589, lng: 35.2131 },
  "اراد": { name: "أراد", lat: 31.2589, lng: 35.2131 },
  "عراد": { name: "أراد", lat: 31.2589, lng: 35.2131 },
  "أوفاكيم": { name: "أوفاكيم", lat: 31.3178, lng: 34.6192 },
  "نتيفوت": { name: "نتيفوت", lat: 31.42, lng: 34.59 },
  "إيلات": { name: "إيلات", lat: 29.5577, lng: 34.9519 },
  "ايلات": { name: "إيلات", lat: 29.5577, lng: 34.9519 },
  "يروحام": { name: "يروحام", lat: 30.9867, lng: 34.9297 },
  // ═══ GAZA ENVELOPE ═══
  "غلاف غزة": { name: "غلاف غزة", lat: 31.39, lng: 34.41 },
  "كيسوفيم": { name: "كيسوفيم", lat: 31.3742, lng: 34.3942 },
  "ناحل عوز": { name: "ناحل عوز", lat: 31.4597, lng: 34.4758 },
  "نير عام": { name: "نير عام", lat: 31.5253, lng: 34.5642 },
  "كفار عزة": { name: "كفار عزة", lat: 31.4867, lng: 34.555 },
  "بئيري": { name: "بئيري", lat: 31.4317, lng: 34.4903 },
  "رعيم": { name: "رعيم", lat: 31.39, lng: 34.44 },
  // ═══ REGION NAMES (Red Alert sections) ═══
  "الجليل الأعلى": { name: "الجليل الأعلى", lat: 33.05, lng: 35.5 },
  "الجليل الأسفل": { name: "الجليل الأسفل", lat: 32.73, lng: 35.37 },
  "الجليل الغربي": { name: "الجليل الغربي", lat: 32.97, lng: 35.13 },
  "مركز الجليل": { name: "مركز الجليل", lat: 32.87, lng: 35.27 },
  "خط المواجهة": { name: "خط المواجهة", lat: 33.05, lng: 35.42 },
  "غوش دان": { name: "غوش دان", lat: 32.0853, lng: 34.7818 },
  "النقب الغربي": { name: "النقب الغربي", lat: 31.2518, lng: 34.7913 },
  "شفيلا": { name: "شفيلا", lat: 31.7466, lng: 34.9886 },
  "المثلث الشمالي": { name: "المثلث الشمالي", lat: 32.5169, lng: 35.1536 },
  "لخيش": { name: "لخيش", lat: 31.6089, lng: 34.7583 },
  "يهودا": { name: "يهودا", lat: 31.7683, lng: 35.2137 },
  "شارون": { name: "شارون", lat: 32.3215, lng: 34.8532 },
  "الكرمل": { name: "الكرمل", lat: 32.71, lng: 34.97 },
  "همفراتس": { name: "همفراتس", lat: 32.81, lng: 35.04 },
  "مناشيه": { name: "مناشيه", lat: 32.4341, lng: 34.9196 },
  "واديعارة": { name: "واديعارة", lat: 32.5169, lng: 35.1536 },
  "الجولان الشمالي": { name: "الجولان الشمالي", lat: 33.08, lng: 35.76 },
  "الجولان الجنوبي": { name: "الجولان الجنوبي", lat: 32.83, lng: 35.74 },
};
const FALLBACK = { name: "شمال إسرائيل", lat: 33.07, lng: 35.37 };

/* ─── Detection patterns ─── */
const IS_RED_ALERT = /اللون\s*الاحمر|اللون\s*الأحمر|🔴\s*اللون/i;
const IS_SIREN = [/صافرات?\s*(انذار|إنذار)/i, /red\s*alert/i, /🔴.*צבע\s*אדום/i, /צבע\s*אדום/i, /אזעקה/i, /صفارات/i, /صفارة/i, /إنذار.*صاروخ/i, /خطالمواجهة/i, /خط\s+المواجهة/i, /تسلل.*طائر/i];
const IS_END   = [/הסתיים/i, /انتهى\s+الحدث/i, /الحدث\s+في.*انتهى/i, /انتهاء.*الحدث/i];
const IS_DRONE = [/طائر|مسيّر|مسير|UAV|drone|כלי\s*טיס/i];

function isRedAlert(text: string): boolean   { return IS_RED_ALERT.test(text); }
function isAlert(text: string): boolean      { return IS_SIREN.some((p) => p.test(text)); }
function isEndMessage(text: string): boolean { return IS_END.some((p) => p.test(text)); }
function isDroneAlert(text: string): boolean { return IS_DRONE.some((p) => p.test(text)); }

// Extract section names from end-event messages like:
// "لقد انتهى الحدث في خطالمواجهة, الجليلالأعلى, همفراتس, ..."
function extractEndSections(text: string): string[] {
  const match = text.match(/الحدث\s+في\s+([^\n(]+)/i);
  if (!match) return [];
  return match[1]
    .split(/[,،]/)
    .map(s => s.trim())
    .filter(s => s.length > 1 && s.length < 40);
}

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
      const endSections = extractEndSections(text);
      const regionNames: string[] = [];

      for (const raw of endSections) {
        // Try section mapping first (covers Red Alert regions)
        const region = findSection(raw);
        if (region && !regionNames.includes(region.name)) {
          regionNames.push(region.name);
          continue;
        }
        // Fall back to area mapping (covers legacy siren formats)
        const mapped = findIsraeliArea(raw);
        if (mapped && !regionNames.includes(mapped.name)) regionNames.push(mapped.name);
      }

      if (regionNames.length > 0) {
        await supabaseAdmin.from("alerts").update({ status: "hidden" })
          .in("area", regionNames)
          .in("type", ["siren_missile", "siren_drone", "siren", "red_alert"])
          .eq("status", "active");
      }

      return NextResponse.json({ ok: true, action: "expired", regions: regionNames });
    }

    /* ─── 2. Handle Red Alert format (🔴 اللون الأحمر) ─── */
    if (isRedAlert(text)) {
      const sections = extractRedAlertSections(text);

      if (sections.length > 0) {
        const rows: object[] = [];
        const alertNames: string[] = [];
        const unmatched: string[] = [];

        for (const { section, cities, shelter } of sections) {
          const sectionRegion = findSection(section);
          const shelterNote = shelter ? ` — وقت الاحتماء: ${shelter}` : "";

          // Create individual alert per city, not per section
          for (const city of cities) {
            // Try to find city in AREA_MAPPING first (exact coordinates)
            const cityArea = findIsraeliArea(city);
            const coords = cityArea || sectionRegion;
            if (!coords) { unmatched.push(city); continue; }

            const areaName = cityArea ? cityArea.name : city;
            if (alertNames.includes(areaName)) continue; // skip duplicates

            rows.push({
              title: "🔴 صافرات إنذار",
              area: areaName,
              type: "red_alert",
              type_label: "🔴 صافرات إنذار",
              color: "#EF4444",
              description: `🔴 صافرات إنذار — ${areaName}.${shelterNote}`,
              lat: coords.lat,
              lng: coords.lng,
              radius: 3000,
              expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
              status: "active",
              is_urgent: true,
            });
            alertNames.push(areaName);
          }
        }

        if (rows.length === 0) {
          return NextResponse.json({ ok: true, skipped: true, reason: "no cities matched", tried: sections.map(s => s.cities).flat() });
        }

        const { data: inserted, error } = await supabaseAdmin.from("alerts").insert(rows).select("id");
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

        if (BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) {
          const firstId = (inserted?.[0] as { id: number } | undefined)?.id || 0;
          const channelMsg = [
            `🔴 صافرات إنذار — اللون الأحمر 🔴`,
            ``,
            `📍 ${alertNames.join("، ")}`,
            ``,
            `📅 ${new Date().toLocaleDateString("ar-LB", { day: "numeric", month: "long", year: "numeric" })}`,
            `🗺️ الخريطة المباشرة: ${SITE_URL}/?alert=${firstId}`,
            ``,
            `#البيان #صافرات #اللون_الأحمر`,
          ].join("\n");

          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHANNEL_ID, text: channelMsg }),
          }).catch(() => {});
        }

        return NextResponse.json({ ok: true, action: "red_alert", created: rows.length, areas: alertNames, unmatched });
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
      const firstId = (inserted?.[0] as { id: number } | undefined)?.id || 0;
      const channelMsg = [
        ``,
        ` ${alertAreas.map(a => a.name).join("، ")}`,
        shelterNote ? `⏱${shelterNote}` : "",
        ``,
        `📅 ${new Date().toLocaleDateString("ar-LB", { day: "numeric", month: "long", year: "numeric" })}`,
        `الخريطة المباشرة: ${SITE_URL}/?alert=${firstId}`,
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