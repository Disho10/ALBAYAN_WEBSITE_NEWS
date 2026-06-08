import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const SITE_URL = "https://albayan-lb.com";
const TELEGRAM_CHANNEL = "https://t.me/AlBayan_Newss";
const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbApl8OBlHpfDzyrrT0f";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) return NextResponse.json({ error: "Telegram not configured" }, { status: 500 });

    const { alerts } = await req.json();
    if (!alerts || !Array.isArray(alerts) || alerts.length === 0) return NextResponse.json({ error: "No alerts" }, { status: 400 });

    const results = [];

    for (const alert of alerts) {
      const urgent = alert.is_urgent ? "🔴 عاجل\n\n" : "";
      const desc = alert.description ? `\n📝 ${alert.description}` : "";
      const now = new Date();
      const date = now.toLocaleDateString("ar-LB", { day: "numeric", month: "long", year: "numeric" });
      const time = now.toLocaleTimeString("ar-LB", { hour: "2-digit", minute: "2-digit", hour12: true });

      const message = [
        `${urgent}${alert.type_label}`,
        `📍 ${alert.area}${desc}`,
        ``,
        `⏱ المدة: ${alert.duration_text || "غير محدد"}`,
        `📅 ${date} · ${time}`,
        `🗺️ الخريطة المباشرة: ${SITE_URL}`,
        `📢 تلغرام: ${TELEGRAM_CHANNEL}`,
        `📱 واتساب: ${WHATSAPP_CHANNEL}`,
        ``,
        `#البيان #تنبيهات_لبنان`,
      ].join("\n");

      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHANNEL_ID, text: message }),
      });
      const data = await res.json();
      results.push({ area: alert.area, ok: data.ok });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Telegram notify error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
