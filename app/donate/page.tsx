"use client";

import Link from "next/link";
import Footer from "@/app/components/Footer";
import PageShell from "@/app/components/PageShell";
import Image from "next/image";
import { useState } from "react";
import { Copy, Check, Server, Map as MapIcon, Zap } from "lucide-react";
import { useApp } from "@/app/components/ThemeProvider";

const FEATURE_ICONS = [
  { Icon: Server, bg: "var(--blue-soft)", color: "var(--blue)" },
  { Icon: MapIcon, bg: "var(--blue-soft)", color: "var(--blue)" },
  { Icon: Zap, bg: "rgba(245,158,11,0.10)", color: "#F59E0B" },
];

export default function DonatePage() {
  const [copied, setCopied] = useState(false);
  const { lang } = useApp();
  const isAr = lang === "ar";

  const c = lang === "ar" ? {
    eyebrow: "ادعمنا",
    h1: "بدعمكم نواصل إيصال الحقيقة",
    heroDesc: "AlBayan Alert Map منصة ميدانية مستقلة تهدف إلى إيصال التنبيهات والتحديثات العاجلة بسرعة وموثوقية. يساهم دعمكم في تغطية تكاليف الخوادم، تطوير الخرائط، وتحسين سرعة وصول التنبيهات إلى الجميع.",
    features: [
      { title: "تشغيل الخوادم", desc: "دعمكم يساعدنا في إبقاء المنصة متاحة وسريعة." },
      { title: "تطوير الخريطة", desc: "تحسين تجربة المستخدم ودقة عرض المناطق والتنبيهات." },
      { title: "سرعة التنبيهات", desc: "تسريع وصول التحديثات العاجلة إلى المستخدمين." },
    ],
    whyTitle: "لماذا الدعم؟",
    statusLabel: "الحالة",
    statusText: "النظام يعمل بشكل طبيعي",
    coverageLabel: "التغطية",
    coverageTitle: "لبنان — جميع المحافظات",
    coverageText: "نعمل على تحسين التغطية حسب توفر المعلومات الميدانية.",
    goalLabel: "الهدف",
    goalTitle: "استمرارية المنصة",
    goalText: "كل مساهمة تساعد في تشغيل الخوادم وتطوير الخدمات.",
    fieldTitle: "لديك معلومة ميدانية؟",
    fieldText: "يمكنك إرسال بلاغ أو تصحيح ليتم مراجعته ومتابعته.",
    fieldBtn: "إرسال بلاغ",
    methodEyebrow: "طريقة الدعم",
    methodH2: "الدعم عبر Wish Money",
    methodDesc: "يمكنك دعم المشروع عبر مسح رمز QR أو نسخ رقم التحويل وإرساله عبر Wish Money.",
    wishSubtitle: "امسح الرمز أو استخدم رقم التحويل",
    qrLabel: "امسح رمز QR للتبرع",
    transferLabel: "رقم التحويل",
    copyBtn: "نسخ الرقم",
    copiedBtn: "تم النسخ",
    faq: [
      { q: "لماذا نطلب الدعم؟", a: "لأن تشغيل الخريطة يحتاج إلى خوادم، تحديثات مستمرة، وتحسينات تقنية لضمان وصول المعلومات بسرعة." },
      { q: "هل الدعم إلزامي؟", a: "لا، استخدام المنصة متاح للجميع. الدعم اختياري ويساعد فقط في استمرار المشروع وتطويره." },
    ],
  } : {
    eyebrow: "Support Us",
    h1: "Your Support Keeps the Truth Flowing",
    heroDesc: "AlBayan Alert Map is an independent field platform delivering alerts and urgent updates quickly and reliably. Your support helps cover server costs, map development, and improve alert delivery speed for everyone.",
    features: [
      { title: "Server Infrastructure", desc: "Your support keeps the platform fast and available." },
      { title: "Map Development", desc: "Improving user experience and alert display accuracy." },
      { title: "Alert Speed", desc: "Speeding up urgent updates to all users." },
    ],
    whyTitle: "Why Support?",
    statusLabel: "Status",
    statusText: "System running normally",
    coverageLabel: "Coverage",
    coverageTitle: "Lebanon — All Governorates",
    coverageText: "We work to improve coverage based on available field information.",
    goalLabel: "Goal",
    goalTitle: "Platform Continuity",
    goalText: "Every contribution helps run servers and develop services.",
    fieldTitle: "Have field information?",
    fieldText: "You can send a report or correction to be reviewed and followed up.",
    fieldBtn: "Send a Report",
    methodEyebrow: "How to Support",
    methodH2: "Support via Wish Money",
    methodDesc: "You can support the project by scanning the QR code or copying the transfer number and sending it via Wish Money.",
    wishSubtitle: "Scan the code or use the transfer number",
    qrLabel: "Scan QR code to donate",
    transferLabel: "Transfer Number",
    copyBtn: "Copy Number",
    copiedBtn: "Copied!",
    faq: [
      { q: "Why do we ask for support?", a: "Because running the map requires servers, continuous updates, and technical improvements to ensure information is delivered quickly." },
      { q: "Is support mandatory?", a: "No, using the platform is free for everyone. Support is optional and only helps continue and develop the project." },
    ],
  };

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>{c.eyebrow}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{c.h1}</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>{c.heroDesc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {c.features.map((f, i) => {
          const { Icon, bg, color } = FEATURE_ICONS[i];
          return (
            <div key={f.title} className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
                <Icon size={22} />
              </div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <aside className="space-y-4 lg:sticky lg:top-6 order-2 lg:order-1">
          <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
            <p className="font-bold mb-4 tracking-widest text-xs" style={{ color: "var(--accent)" }}>{c.whyTitle}</p>
            <div className="space-y-5">
              <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{c.statusLabel}</p>
                <h3 className="font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />{c.statusText}
                </h3>
              </div>
              <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{c.coverageLabel}</p>
                <h3 className="font-bold">{c.coverageTitle}</h3>
                <p className="text-sm mt-2 leading-7" style={{ color: "var(--text-secondary)" }}>{c.coverageText}</p>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{c.goalLabel}</p>
                <h3 className="font-bold">{c.goalTitle}</h3>
                <p className="text-sm mt-2 leading-7" style={{ color: "var(--text-secondary)" }}>{c.goalText}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <h3 className="text-lg font-bold mb-3">{c.fieldTitle}</h3>
            <p className="leading-7 mb-5" style={{ color: "var(--text-secondary)" }}>{c.fieldText}</p>
            <Link href="/report" className="block text-center rounded-xl px-5 py-3 font-bold text-white" style={{ background: "var(--accent)" }}>{c.fieldBtn}</Link>
          </div>
        </aside>

        <div className="lg:col-span-2 rounded-2xl p-6 md:p-8 order-1 lg:order-2" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="text-center mb-8">
            <p className="font-bold mb-3 tracking-widest text-xs" style={{ color: "var(--accent)" }}>{c.methodEyebrow}</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{c.methodH2}</h2>
            <p className="leading-8 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>{c.methodDesc}</p>
          </div>

          <div className="max-w-md mx-auto rounded-2xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <div className="p-6 text-center" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
                <Image src="/wish-logo.jpg" alt="Wish Money" width={76} height={76} className="rounded-full" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Wish Money</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.wishSubtitle}</p>
            </div>

            <div className="p-6">
              <h4 className="text-center tracking-widest mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>{c.qrLabel}</h4>
              <div className="bg-white rounded-2xl p-2 w-fit mx-auto">
                <Image src="/qr.png" alt="QR Code" width={185} height={185} className="contrast-200 brightness-0" />
              </div>
              <div className="mt-6 rounded-2xl py-4 px-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>{c.transferLabel}</p>
                <div className="text-2xl font-extrabold tracking-wide" dir="ltr">+961 76 096 674</div>
              </div>
              <div className="flex justify-center mt-5">
                <button
                  onClick={() => { navigator.clipboard.writeText("+96176096674"); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition text-white ${copied ? "bg-green-600" : ""}`}
                  style={copied ? {} : { background: "var(--accent)" }}>
                  {copied ? <><Check size={18} />{c.copiedBtn}</> : <><Copy size={18} />{c.copyBtn}</>}
                </button>
              </div>
            </div>
          </div>

          {/* Additional payment methods */}
          <div className="max-w-md mx-auto mt-6 grid grid-cols-1 gap-4">
            <div className="rounded-2xl p-6 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center text-lg" style={{ background: "var(--blue-soft)" }}>💵</div>
              <h3 className="text-lg font-bold mb-2">OMT</h3>
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>{isAr ? "يمكنك إرسال تحويل عبر أي فرع OMT في لبنان" : "Send a transfer via any OMT branch in Lebanon"}</p>
              <div className="rounded-xl py-3 px-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>{isAr ? "الاسم" : "Name"}</p>
                <div className="text-lg font-extrabold" dir="ltr">Ali Disho</div>
              </div>
            </div>

            <div className="rounded-2xl p-6 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center text-lg" style={{ background: "rgba(245,158,11,0.10)" }}>₮</div>
              <h3 className="text-lg font-bold mb-2">USDT (TRC20)</h3>
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>{isAr ? "تبرع بالعملات الرقمية عبر شبكة Tron" : "Donate with crypto via the Tron network"}</p>
              <div className="rounded-xl py-3 px-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>{isAr ? "عنوان المحفظة" : "Wallet Address"}</p>
                <div className="text-xs font-mono font-bold break-all" dir="ltr" style={{ color: "var(--text-secondary)" }}>{isAr ? "يُحدّث قريباً" : "Coming soon"}</div>
              </div>
            </div>
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
