export type Area = {
  name: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  district: string;
  governorate: string;
  pcode: string;
};

export type AlertItem = {
  id: number;
  title: string;
  area: string;
  type: string;
  type_label: string;
  color: string;
  description: string;
  lat: number;
  lng: number;
  radius: number;
  expires_at?: string | null;
  status?: string;
  is_urgent?: boolean;
  created_at?: string;
};

export const ALERT_TYPES = [
  { type: "strike", label: "🚨 غارة", color: "#EF4444", radius: 900 },
  { type: "artillery", label: "💥 قصف مدفعي", color: "#DC2626", radius: 900 },
  { type: "drone", label: "🚁 نشاط مسيّر", color: "#1E5EFF", radius: 1200 },
  { type: "threat", label: "⚠️ تهديد", color: "#F59E0B", radius: 1000 },
  { type: "enemy_position", label: "📍 تمركز العدو", color: "#A855F7", radius: 1000 },
  { type: "army_position", label: "🟢 انتشار الجيش اللبناني", color: "#22C55E", radius: 1000 },
  { type: "traffic", label: "🚗 حادث سير", color: "#38BDF8", radius: 700 },
  { type: "crowd", label: "⭕ اشتباكات", color: "#DC2626", radius: 700 },
  { type: "fire", label: "🔥 حريق", color: "#F97316", radius: 800 },
  { type: "injuries", label: "🚑 إصابات", color: "#E11D48", radius: 800 },
];

export const TELEGRAM_CHANNEL_URL = "https://t.me/AlBayan_Newss";
export const WHATSAPP_URL = "https://wa.me/96176096674";
export const TELEGRAM_BOT_URL = "https://t.me/AlBayanReporterBot";
