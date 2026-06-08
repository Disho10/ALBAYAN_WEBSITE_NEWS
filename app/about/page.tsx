"use client";

import Link from "next/link";
import { useApp } from "@/app/components/ThemeProvider";
import PageShell from "@/app/components/PageShell";
import Footer from "@/app/components/Footer";
import { TELEGRAM_CHANNEL_URL, TELEGRAM_BOT_URL } from "@/app/lib/types";

export default function AboutPage() {
  const { t, lang } = useApp();

  const content = lang === "ar" ? {
    hero: "البيان الإخباري — من قلب الحدث",
    heroDesc: "منصة ميدانية مستقلة تهدف إلى إيصال التنبيهات والأحداث المهمة في لبنان بشكل سريع، دقيق، ومنظم عبر خريطة تفاعلية مباشرة.",
    missionTitle: "مهمتنا",
    missionText: "توفير منصة مجانية تعرض التنبيهات الميدانية بشكل مباشر على الخريطة، لمساعدة المواطنين على متابعة ما يجري في مناطقهم واتخاذ قرارات مبنية على معلومات واضحة ومحدثة.",
    features: [
      { icon: "🗺️", title: "خريطة تفاعلية مباشرة", desc: "متابعة الأحداث والتنبيهات لحظة بلحظة على خريطة لبنان." },
      { icon: "🚨", title: "تنبيهات فورية", desc: "إشعارات صوتية وبصرية عند وصول تنبيه عاجل." },
      { icon: "📡", title: "مصادر متعددة", desc: "مراسلون ميدانيون، بلاغات المستخدمين، ومصادر موثوقة." },
      { icon: "🔒", title: "خصوصية كاملة", desc: "لا نتتبع موقعك ولا نبيع بياناتك لأي جهة." },
      { icon: "🌐", title: "متعدد اللغات", desc: "واجهة عربية وإنجليزية لتوسيع نطاق الوصول." },
      { icon: "📱", title: "متوافق مع الجوال", desc: "تجربة محسنة للهواتف المحمولة وتطبيقات التلغرام." },
    ],
    correspondentTitle: "كن مراسلاً ميدانياً",
    correspondentText: "نرحب بأي شخص يرغب في المساهمة في نقل الأخبار والمعلومات من المناطق. تواصل معنا عبر بوت الإبلاغ الرسمي.",
    independentTitle: "مشروع مستقل",
    independentText: "البيان الإخباري مشروع مستقل لا يمثل أي جهة حكومية أو رسمية. نعمل بدعم المجتمع ونلتزم بالشفافية والدقة قدر الإمكان.",
  } : {
    hero: "AlBayan News — From the Heart of the Action",
    heroDesc: "An independent field platform delivering real-time alerts and critical events in Lebanon through an interactive live map.",
    missionTitle: "Our Mission",
    missionText: "To provide a free platform that displays field alerts directly on the map, helping citizens stay informed about what's happening in their areas and make decisions based on clear, up-to-date information.",
    features: [
      { icon: "🗺️", title: "Live Interactive Map", desc: "Follow events and alerts moment by moment on the map of Lebanon." },
      { icon: "🚨", title: "Instant Alerts", desc: "Audio and visual notifications when an urgent alert arrives." },
      { icon: "📡", title: "Multiple Sources", desc: "Field correspondents, user reports, and verified sources." },
      { icon: "🔒", title: "Full Privacy", desc: "We don't track your location or sell your data to anyone." },
      { icon: "🌐", title: "Multilingual", desc: "Arabic and English interface for wider accessibility." },
      { icon: "📱", title: "Mobile Friendly", desc: "Optimized for mobile phones and Telegram apps." },
    ],
    correspondentTitle: "Become a Field Correspondent",
    correspondentText: "We welcome anyone who wants to contribute by reporting news and information from their area. Contact us through the official reporting bot.",
    independentTitle: "Independent Project",
    independentText: "AlBayan News is an independent project and does not represent any government or official entity. We operate with community support and are committed to transparency and accuracy.",
  };

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>{t("aboutTitle")}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{content.hero}</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>{content.heroDesc}</p>
      </div>

      <div className="rounded-2xl p-6 md:p-8 mb-8 max-w-4xl mx-auto text-center" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
        <h2 className="text-2xl font-extrabold mb-4">{content.missionTitle}</h2>
        <p className="leading-8" style={{ color: "var(--text-secondary)" }}>{content.missionText}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-w-5xl mx-auto">
        {content.features.map((f) => (
          <div key={f.title} className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="font-bold mb-1">{f.title}</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-red-600 to-red-700 text-white">
          <h3 className="text-xl font-bold mb-3">{content.correspondentTitle}</h3>
          <p className="text-white/90 leading-7 mb-5">{content.correspondentText}</p>
          <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer"
            className="inline-block bg-white text-red-600 hover:bg-slate-100 transition rounded-xl px-6 py-3 font-bold">{t("report")}</a>
        </div>
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
          <h3 className="text-xl font-bold mb-3">{content.independentTitle}</h3>
          <p className="leading-7 mb-5" style={{ color: "var(--text-secondary)" }}>{content.independentText}</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/donate" className="text-center rounded-xl px-4 py-3 font-bold text-white" style={{ background: "var(--accent)" }}>{t("supportUs")}</Link>
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer"
              className="text-center rounded-xl px-4 py-3 font-bold" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}>{t("telegram")}</a>
          </div>
        </div>
      </div>
      <Footer />
    </PageShell>
  );
}
