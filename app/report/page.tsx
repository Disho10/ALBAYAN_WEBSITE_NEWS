"use client";

import Link from "next/link";
import Footer from "@/app/components/Footer";
import PageShell from "@/app/components/PageShell";
import { Send, Search, Map as MapIcon, AlertTriangle } from "lucide-react";
import { useApp } from "@/app/components/ThemeProvider";

const STEP_ICONS = [
  { Icon: Send, bg: "var(--green-soft)", color: "var(--green)" },
  { Icon: Search, bg: "var(--blue-soft)", color: "var(--blue)" },
  { Icon: MapIcon, bg: "var(--blue-soft)", color: "var(--blue)" },
];

export default function ReportPage() {
  const { lang } = useApp();

  const c = lang === "ar" ? {
    eyebrow: "الإبلاغ",
    h1: "الإبلاغ عن حدث ميداني",
    heroDesc: "يمكنك إرسال خبر، صورة، فيديو، أو تصحيح عبر بوت الإبلاغ الرسمي. سيقوم فريقنا بمراجعة البلاغ والتحقق منه قبل نشره على الخريطة.",
    steps: [
      { title: "أرسل البلاغ", desc: "أرسل التفاصيل عبر البوت الرسمي." },
      { title: "نراجع المعلومات", desc: "تتم مراجعة البلاغ قبل نشره." },
      { title: "يظهر على الخريطة", desc: "يتم نشر التنبيه بعد التحقق منه." },
    ],
    infoTitle: "معلومات البلاغ",
    statusLabel: "الحالة",
    statusText: "بوت الإبلاغ متاح",
    acceptedLabel: "المقبول",
    acceptedText: "استقبال الأخبار الميدانية والمعلومات العاجلة والتحديثات المحلية من المراسلين والمستخدمين.",
    reviewLabel: "المراجعة",
    reviewText: "لا يتم نشر كل البلاغات مباشرة، بل تتم مراجعتها قدر الإمكان قبل اعتمادها.",
    clearTitle: "أرسل معلومات واضحة",
    clearText: "كلما كان البلاغ واضحًا ويتضمن منطقة، وقت، وصف، وصورة أو فيديو عند توفرها، ساعدنا ذلك على التحقق بشكل أسرع.",
    donateTitle: "ساهم في استمرارية المشروع",
    donateText: "دعمكم يساعدنا في تطوير الخريطة وتحسين سرعة وصول التنبيهات.",
    donateBtn: "دعم المشروع",
    botEyebrow: "بوت الإبلاغ",
    botH2: "افتح بوت الإبلاغ الرسمي",
    botDesc: "اضغط على الزر أدناه للانتقال إلى بوت التلغرام وإرسال البلاغ مباشرة إلى فريق المتابعة.",
    reportTypeLabel: "نوع البلاغ",
    reportTypeVal: "أخبار وتنبيهات ميدانية",
    publishLabel: "حالة النشر",
    publishVal: "يتم التحقق قبل النشر",
    openBotBtn: "فتح بوت الإبلاغ",
    disclaimer: "الرجاء عدم إرسال بلاغات غير مؤكدة أو معلومات قد تسبب الذعر. نستخدم البلاغات فقط للمراجعة والمتابعة.",
    faq: [
      { q: "ما الذي يجب إرساله؟", a: "اسم المنطقة، نوع الحدث، الوقت التقريبي، وصف مختصر." },
      { q: "متى يتم نشر البلاغ؟", a: "يتم نشر البلاغ عند توفر معلومات كافية وبعد مراجعته من فريق المنصة قدر الإمكان." },
    ],
  } : {
    eyebrow: "Report",
    h1: "Report a Field Event",
    heroDesc: "You can send news, photos, videos, or corrections via the official reporting bot. Our team will review and verify the report before publishing it on the map.",
    steps: [
      { title: "Send the Report", desc: "Send the details through the official bot." },
      { title: "We Review", desc: "The report is reviewed before publishing." },
      { title: "Appears on Map", desc: "The alert is published after verification." },
    ],
    infoTitle: "Report Information",
    statusLabel: "Status",
    statusText: "Reporting Bot Available",
    acceptedLabel: "Accepted",
    acceptedText: "Receiving field news, urgent information, and local updates from correspondents and users.",
    reviewLabel: "Review",
    reviewText: "Not all reports are published immediately — they are reviewed as much as possible before being approved.",
    clearTitle: "Send Clear Information",
    clearText: "The clearer your report — including area, time, description, and photo or video when available — the faster we can verify it.",
    donateTitle: "Support Project Continuity",
    donateText: "Your support helps us develop the map and improve alert delivery speed.",
    donateBtn: "Support the Project",
    botEyebrow: "Reporting Bot",
    botH2: "Open the Official Reporting Bot",
    botDesc: "Tap the button below to go to the Telegram bot and send your report directly to the monitoring team.",
    reportTypeLabel: "Report Type",
    reportTypeVal: "Field News & Alerts",
    publishLabel: "Publication Status",
    publishVal: "Verified before publishing",
    openBotBtn: "Open Reporting Bot",
    disclaimer: "Please do not send unconfirmed reports or information that may cause panic. We use reports only for review and follow-up.",
    faq: [
      { q: "What should I send?", a: "Area name, event type, approximate time, and a brief description." },
      { q: "When will my report be published?", a: "The report is published when enough information is available and after review by the platform team." },
    ],
  };

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "#F59E0B" }}>{c.eyebrow}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{c.h1}</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>{c.heroDesc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {c.steps.map((step, i) => {
          const { Icon, bg, color } = STEP_ICONS[i];
          return (
            <div key={step.title} className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
                <Icon size={22} />
              </div>
              <h3 className="font-bold mb-2">{step.title}</h3>
              <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{step.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <aside className="space-y-4 lg:sticky lg:top-6 order-2 lg:order-1">
          <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
            <p className="font-bold mb-4 tracking-widest text-xs" style={{ color: "#F59E0B" }}>{c.infoTitle}</p>
            <div className="space-y-5">
              <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{c.statusLabel}</p>
                <h3 className="font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />{c.statusText}
                </h3>
              </div>
              <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{c.acceptedLabel}</p>
                <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{c.acceptedText}</p>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{c.reviewLabel}</p>
                <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{c.reviewText}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <h3 className="text-lg font-bold mb-3">{c.clearTitle}</h3>
            <p className="leading-7" style={{ color: "var(--text-secondary)" }}>{c.clearText}</p>
          </div>

          <div className="rounded-2xl p-6 bg-gradient-to-br from-red-600 to-red-700 text-white">
            <h3 className="text-lg font-bold mb-3">{c.donateTitle}</h3>
            <p className="text-white/90 leading-7 mb-5">{c.donateText}</p>
            <Link href="/donate" className="block text-center bg-white text-red-600 hover:bg-slate-100 transition rounded-xl px-5 py-3 font-bold">{c.donateBtn}</Link>
          </div>
        </aside>

        <div className="lg:col-span-2 rounded-2xl p-6 md:p-8 order-1 lg:order-2" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#F59E0B" }}>
              <AlertTriangle size={28} />
            </div>
            <p className="font-bold mb-3 tracking-widest text-xs" style={{ color: "var(--accent)" }}>{c.botEyebrow}</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{c.botH2}</h2>
            <p className="leading-8 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>{c.botDesc}</p>
          </div>

          <div className="max-w-xl mx-auto rounded-2xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl p-4" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>{c.reportTypeLabel}</p>
                <p className="font-bold">{c.reportTypeVal}</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>{c.publishLabel}</p>
                <p className="font-bold">{c.publishVal}</p>
              </div>
            </div>
            <a href="https://t.me/AlBayanReporterBot" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 transition rounded-2xl px-8 py-4 font-extrabold text-lg text-white"
              style={{ background: "var(--accent)" }}>
              <AlertTriangle size={20} />
              {c.openBotBtn}
            </a>
            <p className="text-sm mt-5 leading-7" style={{ color: "var(--text-secondary)" }}>{c.disclaimer}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {c.faq.map((item) => (
              <div key={item.q} className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <h3 className="font-bold mb-2">{item.q}</h3>
                <p className="leading-7 text-sm" style={{ color: "var(--text-secondary)" }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </PageShell>
  );
}
