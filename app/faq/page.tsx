"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import PageShell from "@/app/components/PageShell";
import { TELEGRAM_CHANNEL_URL, WHATSAPP_URL } from "@/app/lib/types";

const faqs = [
  { q: "ما هو AlBayan Alert Map؟", a: "AlBayan Alert Map منصة ميدانية وإخبارية تهدف إلى عرض التنبيهات والأحداث المهمة على الخريطة بشكل سريع ومنظم، مع تقديم تحديثات واضحة تساعد المستخدمين على متابعة ما يجري حسب المناطق." },
  { q: "من أين تحصلون على المعلومات؟", a: "نعتمد على مصادر ميدانية، مراسلين، بلاغات المستخدمين، ومصادر موثوقة، مع محاولة التحقق من المعلومات قبل نشرها أو تحديثها قدر الإمكان." },
  { q: "هل جميع التنبيهات مؤكدة؟", a: "نسعى للتحقق قدر الإمكان، لكن بعض التنبيهات الأولية قد تكون قيد المتابعة أو التحديث بحسب تطور الحدث وتوفر معلومات إضافية." },
  { q: "هل يمكنني إرسال بلاغ؟", a: "نعم، يمكن لأي شخص إرسال بلاغ أو معلومة ميدانية عبر صفحة البلاغات أو عبر البوت الرسمي، وسيتم مراجعة البلاغ قبل الاعتماد عليه." },
  { q: "هل يمكنني أن أصبح مراسلًا؟", a: "نرحب بالمساهمين والمراسلين الميدانيين، ويمكن التواصل معنا عبر القنوات الرسمية للمشاركة في نقل الأخبار والمعلومات من المناطق." },
  { q: "هل أحتاج إلى إنشاء حساب؟", a: "لا، يمكن استخدام الموقع ومتابعة التنبيهات دون إنشاء حساب أو تسجيل دخول." },
  { q: "لماذا تطلبون الدعم؟", a: "يساعد الدعم في تغطية تكاليف الخوادم، تطوير المنصة، تحديث الخرائط، وتحسين سرعة وصول التنبيهات إلى المستخدمين." },
  { q: "هل يتم حفظ موقعي الجغرافي؟", a: "لا يتم تتبع أو حفظ موقعك الجغرافي إلا إذا اخترت مشاركة معلومات الموقع بنفسك أثناء إرسال بلاغ." },
  { q: "ماذا أفعل إذا وجدت معلومة غير صحيحة؟", a: "يمكنك إرسال تصحيح أو ملاحظة عبر صفحة البلاغات، وسنقوم بمراجعتها بأسرع وقت ممكن وتحديث المعلومات عند الحاجة." },
  { q: "هل الموقع تابع لجهة رسمية؟", a: "AlBayan Alert Map مشروع مستقل ولا يمثل أي جهة حكومية أو رسمية ما لم يُذكر ذلك صراحة." },
];

const sideInfo = [
  { label: "الحالة", title: "النظام يعمل بشكل طبيعي", text: "يتم تحديث المنصة ومتابعة البلاغات بشكل مستمر.", dot: true },
  { label: "التغطية", title: "لبنان — جميع المحافظات", text: "تغطية الأخبار والتنبيهات حسب المناطق عند توفر المعلومات." },
  { label: "المصادر", title: "مصادر المعلومات", text: "مراسلون ميدانيون، بلاغات المستخدمين، مصادر مفتوحة، ومتابعة مباشرة للأحداث." },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>مركز المساعدة</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">الأسئلة الشائعة</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          صفحة مخصصة للإجابة على أكثر الأسئلة شيوعًا حول المنصة، وآلية نشر التنبيهات، وطريقة إرسال البلاغات.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "🗺️", title: "خريطة ميدانية", text: "عرض الأحداث والتنبيهات حسب المنطقة." },
          { icon: "🚨", title: "تنبيهات سريعة", text: "متابعة التحديثات العاجلة بشكل منظم." },
          { icon: "📩", title: "بلاغات المستخدمين", text: "إرسال معلومات ميدانية للمراجعة والمتابعة." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl p-5 text-center transition" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
            <div className="text-3xl mb-2">{c.icon}</div>
            <h3 className="font-bold mb-1">{c.title}</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.text}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 rounded-2xl p-6 md:p-8" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="text-center mb-8">
            <p className="font-bold mb-3 tracking-widest text-xs" style={{ color: "var(--accent)" }}>الأسئلة والأجوبة</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">كل شيء عليك معرفته</h2>
            <p className="leading-8 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              جمعنا لك أهم الأسئلة حول مصادر المعلومات، دقة التنبيهات، البلاغات، الخصوصية، والدعم.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={item.q} className="rounded-xl overflow-hidden transition-all duration-300"
                  style={{
                    background: isOpen ? "var(--bg-elevated)" : "var(--bg-card)",
                    border: `1px solid ${isOpen ? "var(--blue)" : "var(--border)"}`,
                    boxShadow: isOpen ? "0 0 20px rgba(59,130,246,0.08)" : "none",
                  }}>
                  <button onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-right">
                    <span className="text-base font-bold">{item.q}</span>
                    <span className="min-w-7 h-7 rounded-full flex items-center justify-center text-lg transition"
                      style={{
                        background: isOpen ? "var(--accent)" : "var(--bg-elevated)",
                        color: isOpen ? "white" : "var(--accent)",
                      }}>
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-3 leading-8" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
            <p className="font-bold mb-4 tracking-widest text-xs" style={{ color: "var(--accent)" }}>معلومات المنصة</p>
            <div className="space-y-5">
              {sideInfo.map((item) => (
                <div key={item.label} className="pb-4 last:pb-0 last:border-b-0" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                  <h3 className="font-bold flex items-center gap-2 mb-2">
                    {item.dot && <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />}
                    {item.title}
                  </h3>
                  <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <h3 className="text-lg font-bold mb-3">هل لديك معلومة ميدانية؟</h3>
            <p className="leading-7 mb-5" style={{ color: "var(--text-secondary)" }}>يمكنك إرسال بلاغ أو تصحيح ليتم مراجعته ومتابعته من فريق المنصة.</p>
            <Link href="/report" className="block text-center rounded-xl px-5 py-3 font-bold text-white" style={{ background: "var(--accent)" }}>إرسال بلاغ</Link>
          </div>

          <div className="rounded-2xl p-6 bg-gradient-to-br from-red-600 to-red-700 text-white">
            <h3 className="text-lg font-bold mb-3">ساهم في استمرارية المشروع</h3>
            <p className="text-white/90 leading-7 mb-5">دعمكم يساعدنا في تغطية تكاليف الخوادم وتطوير خدمات التنبيهات.</p>
            <Link href="/donate" className="block text-center bg-white text-red-600 hover:bg-slate-100 transition rounded-xl px-5 py-3 font-bold">دعم المشروع</Link>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
            <h3 className="text-lg font-bold mb-3">تابع التنبيهات أولًا بأول</h3>
            <p className="leading-7 mb-5" style={{ color: "var(--text-secondary)" }}>انضم إلى قنواتنا الرسمية لمتابعة آخر التحديثات والتنبيهات.</p>
            <div className="grid grid-cols-2 gap-3">
              <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer"
                className="text-center rounded-xl px-4 py-3 transition" style={{ border: "1px solid var(--border)" }}>تلغرام</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="text-center rounded-xl px-4 py-3 transition" style={{ border: "1px solid var(--border)" }}>واتساب</a>
            </div>
          </div>
        </aside>
      </div>
      <Footer />
    </PageShell>
  );
}
