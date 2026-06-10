"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import PageShell from "@/app/components/PageShell";
import { useApp } from "@/app/components/ThemeProvider";
import { TELEGRAM_CHANNEL_URL, WHATSAPP_URL } from "@/app/lib/types";

const faqs = {
  ar: [
    { q: "ما هو AlBayan Alert Map؟", a: "AlBayan Alert Map منصة ميدانية وإخبارية تهدف إلى عرض التنبيهات والأحداث المهمة على الخريطة بشكل سريع ومنظم، مع تقديم تحديثات واضحة تساعد المستخدمين على متابعة ما يجري حسب المناطق." },
    { q: "من أين تحصلون على المعلومات؟", a: "نعتمد على مصادر ميدانية، مراسلين، بلاغات المستخدمين، ومصادر موثوقة، مع محاولة التحقق من المعلومات قبل نشرها أو تحديثها قدر الإمكان." },
    { q: "هل جميع التنبيهات مؤكدة؟", a: "نسعى للتحقق قدر الإمكان، لكن بعض التنبيهات الأولية قد تكون قيد المتابعة أو التحديث بحسب تطور الحدث وتوفر معلومات إضافية." },
    { q: "هل يمكنني إرسال بلاغ؟", a: "نعم، يمكن لأي شخص إرسال بلاغ أو معلومة ميدانية عبر صفحة البلاغات أو عبر البوت الرسمي، وسيتم مراجعة البلاغ قبل الاعتماد عليه." },
    { q: "هل يمكنني أن أصبح مراسلًا؟", a: "نرحب بالمساهمين والمراسلين الميدانيين، ويمكن التواصل معنا عبر القنوات الرسمية للمشاركة في نقل الأخبار." },
    { q: "هل أحتاج إلى إنشاء حساب؟", a: "لا، يمكن استخدام الموقع ومتابعة التنبيهات دون إنشاء حساب أو تسجيل دخول." },
    { q: "لماذا تطلبون الدعم؟", a: "يساعد الدعم في تغطية تكاليف الخوادم، تطوير المنصة، تحديث الخرائط، وتحسين سرعة وصول التنبيهات إلى المستخدمين." },
    { q: "هل يتم حفظ موقعي الجغرافي؟", a: "لا يتم تتبع أو حفظ موقعك الجغرافي إلا إذا اخترت مشاركة معلومات الموقع بنفسك أثناء إرسال بلاغ." },
    { q: "ماذا أفعل إذا وجدت معلومة غير صحيحة؟", a: "يمكنك إرسال تصحيح أو ملاحظة عبر صفحة البلاغات، وسنقوم بمراجعتها بأسرع وقت ممكن." },
    { q: "هل الموقع تابع لجهة رسمية؟", a: "AlBayan Alert Map مشروع مستقل ولا يمثل أي جهة حكومية أو رسمية ما لم يُذكر ذلك صراحة." },
  ],
  en: [
    { q: "What is AlBayan Alert Map?", a: "AlBayan Alert Map is an independent field and news platform that displays alerts and important events on a live map in an organized manner, helping users follow what's happening by region." },
    { q: "Where do you get your information?", a: "We rely on field sources, correspondents, user reports, and verified sources, with efforts to verify information before publishing or updating it." },
    { q: "Are all alerts confirmed?", a: "We strive to verify as much as possible, but some initial alerts may be pending follow-up or updates as events develop and additional information becomes available." },
    { q: "Can I submit a report?", a: "Yes, anyone can submit a report or field information through the reports page or via the official bot. Reports are reviewed before being published." },
    { q: "Can I become a correspondent?", a: "We welcome contributors and field correspondents. You can contact us through official channels to participate in reporting news." },
    { q: "Do I need to create an account?", a: "No, you can use the website and follow alerts without creating an account or logging in." },
    { q: "Why do you ask for support?", a: "Support helps cover server costs, platform development, map updates, and improving the speed of alert delivery to users." },
    { q: "Is my location saved?", a: "Your location is not tracked or saved unless you choose to share location information yourself when submitting a report." },
    { q: "What if I find incorrect information?", a: "You can submit a correction or note through the reports page, and we will review it as soon as possible." },
    { q: "Is the site affiliated with an official entity?", a: "AlBayan Alert Map is an independent project and does not represent any government or official entity unless explicitly stated." },
  ],
};

export default function FAQPage() {
  const { t, lang } = useApp();
  const isAr = lang === "ar";
  const items = isAr ? faqs.ar : faqs.en;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>{t("faq")}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{t("faq")}</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          {isAr ? "صفحة مخصصة للإجابة على أكثر الأسئلة شيوعًا حول المنصة." : "Answers to the most frequently asked questions about the platform."}
        </p>
        <div className="mt-4 inline-block rounded-xl px-4 py-2 text-xs" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          {isAr ? "آخر تحديث: يونيو 2026" : "Last updated: June 2026"}
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-3 mb-12">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: isOpen ? "var(--bg-elevated)" : "var(--bg-card)", border: `1px solid ${isOpen ? "var(--blue)" : "var(--border)"}` }}>
              <button onClick={() => setOpenIndex(isOpen ? null : i)} className="w-full flex items-center justify-between gap-4 p-5" style={{ textAlign: isAr ? "right" : "left" }}>
                <span className="text-base font-bold">{item.q}</span>
                <span className="min-w-7 h-7 rounded-full flex items-center justify-center text-lg" style={{ background: isOpen ? "var(--accent)" : "var(--bg-elevated)", color: isOpen ? "white" : "var(--accent)" }}>
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && <div className="px-5 pb-5 pt-3 leading-8" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}>{item.a}</div>}
            </div>
          );
        })}
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
          <h3 className="text-lg font-bold mb-3">{isAr ? "لديك معلومة ميدانية؟" : "Have field information?"}</h3>
          <p className="leading-7 mb-5" style={{ color: "var(--text-secondary)" }}>{isAr ? "يمكنك إرسال بلاغ ليتم مراجعته ومتابعته." : "Submit a report for review and follow-up."}</p>
          <Link href="/report" className="block text-center rounded-xl px-5 py-3 font-bold text-white" style={{ background: "var(--accent)" }}>{t("report")}</Link>
        </div>
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
          <h3 className="text-lg font-bold mb-3">{isAr ? "تابعنا" : "Follow us"}</h3>
          <p className="leading-7 mb-5" style={{ color: "var(--text-secondary)" }}>{isAr ? "انضم إلى قنواتنا الرسمية لمتابعة آخر التحديثات." : "Join our official channels for the latest updates."}</p>
          <div className="grid grid-cols-2 gap-3">
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="text-center rounded-xl px-4 py-3 transition font-bold" style={{ border: "1px solid var(--border)" }}>{t("telegram")}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-center rounded-xl px-4 py-3 transition font-bold" style={{ border: "1px solid var(--border)" }}>{t("whatsapp")}</a>
          </div>
        </div>
      </div>
      <Footer />
    </PageShell>
  );
}
