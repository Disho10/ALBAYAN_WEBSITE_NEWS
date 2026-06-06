import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

export async function POST(req: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
      return NextResponse.json(
        { error: "Telegram not configured" },
        { status: 500 }
      );
    }

    const { alerts } = await req.json();

    if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
      return NextResponse.json({ error: "No alerts provided" }, { status: 400 });
    }

    const results = [];

    for (const alert of alerts) {
      const urgent = alert.is_urgent ? "🔴 عاجل\n\n" : "";
      const desc = alert.description
        ? `\n📝 ${alert.description}`
        : "";

      const message =
        `${urgent}${alert.type_label}\n` +
        `📍 ${alert.area}${desc}\n\n` +
        `🕐 مدة الظهور: ${alert.duration_text || "غير محدد"}\n` +
        `🗺️ شاهد على الخريطة: ${process.env.NEXT_PUBLIC_SITE_URL || "https://albayan-alert-map.vercel.app"}\n\n` +
        `#البيان #تنبيهات_لبنان`;

      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHANNEL_ID,
            text: message,
            parse_mode: "HTML",
          }),
        }
      );

      const data = await res.json();
      results.push({ area: alert.area, ok: data.ok });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Telegram notify error:", error);
    return NextResponse.json(
      { error: "Failed to send Telegram notification" },
      { status: 500 }
    );
  }
}
