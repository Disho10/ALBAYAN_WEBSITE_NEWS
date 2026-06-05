"use client";

import { useState } from "react";

const faqs = [
  {
    q: "ما هو AlBayan Alert Map؟",
    a: "AlBayan Alert Map منصة ميدانية وإخبارية تهدف إلى عرض التنبيهات والأحداث المهمة على الخريطة بشكل سريع ومنظم، مع تقديم تحديثات واضحة تساعد المستخدمين على متابعة ما يجري حسب المناطق.",
  },
  {
    q: "من أين تحصلون على المعلومات؟",
    a: "نعتمد على مصادر ميدانية، مراسلين، بلاغات المستخدمين، ومصادر موثوقة، مع محاولة التحقق من المعلومات قبل نشرها أو تحديثها قدر الإمكان.",
  },
  {
    q: "هل جميع التنبيهات مؤكدة؟",
    a: "نسعى للتحقق قدر الإمكان، لكن بعض التنبيهات الأولية قد تكون قيد المتابعة أو التحديث بحسب تطور الحدث وتوفر معلومات إضافية.",
  },
  {
    q: "هل يمكنني إرسال بلاغ؟",
    a: "نعم، يمكن لأي شخص إرسال بلاغ أو معلومة ميدانية عبر صفحة البلاغات أو عبر البوت الرسمي، وسيتم مراجعة البلاغ قبل الاعتماد عليه.",
  },
  {
    q: "هل يمكنني أن أصبح مراسلًا؟",
    a: "نرحب بالمساهمين والمراسلين الميدانيين، ويمكن التواصل معنا عبر القنوات الرسمية للمشاركة في نقل الأخبار والمعلومات من المناطق.",
  },
  {
    q: "هل أحتاج إلى إنشاء حساب؟",
    a: "لا، يمكن استخدام الموقع ومتابعة التنبيهات دون إنشاء حساب أو تسجيل دخول.",
  },
  {
    q: "لماذا تطلبون الدعم؟",
    a: "يساعد الدعم في تغطية تكاليف الخوادم، تطوير المنصة، تحديث الخرائط، وتحسين سرعة وصول التنبيهات إلى المستخدمين.",
  },
  {
    q: "هل يتم حفظ موقعي الجغرافي؟",
    a: "لا يتم تتبع أو حفظ موقعك الجغرافي إلا إذا اخترت مشاركة معلومات الموقع بنفسك أثناء إرسال بلاغ.",
  },
  {
    q: "ماذا أفعل إذا وجدت معلومة غير صحيحة؟",
    a: "يمكنك إرسال تصحيح أو ملاحظة عبر صفحة البلاغات، وسنقوم بمراجعتها بأسرع وقت ممكن وتحديث المعلومات عند الحاجة.",
  },
  {
    q: "هل الموقع تابع لجهة رسمية؟",
    a: "AlBayan Alert Map مشروع مستقل ولا يمثل أي جهة حكومية أو رسمية ما لم يُذكر ذلك صراحة.",
  },
];

const quickCards = [
  {
    icon: "🗺️",
    title: "خريطة ميدانية",
    text: "عرض الأحداث والتنبيهات حسب المنطقة.",
  },
  {
    icon: "🚨",
    title: "تنبيهات سريعة",
    text: "متابعة التحديثات العاجلة بشكل منظم.",
  },
  {
    icon: "📩",
    title: "بلاغات المستخدمين",
    text: "إرسال معلومات ميدانية للمراجعة والمتابعة.",
  },
];

const sideInfo = [
  {
    label: "STATUS",
    title: "النظام يعمل بشكل طبيعي",
    text: "يتم تحديث المنصة ومتابعة البلاغات بشكل مستمر.",
    dot: true,
  },
  {
    label: "COVERAGE",
    title: "لبنان — جميع المحافظات",
    text: "تغطية الأخبار والتنبيهات حسب المناطق عند توفر المعلومات.",
  },
  {
    label: "SOURCES",
    title: "مصادر المعلومات",
    text: "مراسلون ميدانيون، بلاغات المستخدمين، مصادر مفتوحة، ومتابعة مباشرة للأحداث.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-[#00152D] text-white p-6" dir="rtl">
      <section className="max-w-6xl mx-auto">
        <a
          href="/"
          className="inline-flex items-center text-[#3B82F6] font-bold hover:text-white transition"
        >
          العودة للخريطة
        </a>

        <div className="mt-10 mb-10 text-center">
          <p className="text-red-400 font-bold mb-3 tracking-widest">
            — HELP CENTER
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            مركز المساعدة والأسئلة الشائعة
          </h1>

          <p className="text-slate-300 leading-8 max-w-3xl mx-auto">
            صفحة مخصصة للإجابة على أكثر الأسئلة شيوعًا حول المنصة، وآلية
            نشر التنبيهات، وطريقة إرسال البلاغات، والتعامل مع المعلومات
            الميدانية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {quickCards.map((card) => (
            <div
              key={card.title}
              className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center hover:border-[#3B82F6] transition"
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <h3 className="font-bold mb-1">{card.title}</h3>
              <p className="text-slate-400 text-sm">{card.text}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(59,130,246,0.12)]">
            <div className="text-center mb-8">
              <p className="text-[#3B82F6] font-bold mb-3 tracking-widest">
                FAQ CENTER
              </p>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                كل شيء عليك معرفته
              </h2>

              <p className="text-slate-300 leading-8 max-w-2xl mx-auto">
                جمعنا لك أهم الأسئلة حول مصادر المعلومات، دقة التنبيهات،
                البلاغات، الخصوصية، والدعم.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((item, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={item.q}
                    className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                      isOpen
                        ? "bg-[#0A3563] border-[#3B82F6] shadow-[0_0_25px_rgba(59,130,246,0.12)]"
                        : "bg-[#001F3F] border-[#134B78]"
                    }`}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="w-full flex items-center justify-between gap-4 p-5 text-right"
                    >
                      <span className="text-lg md:text-xl font-bold">
                        {item.q}
                      </span>

                      <span
                        className={`min-w-8 h-8 rounded-full flex items-center justify-center text-xl transition ${
                          isOpen
                            ? "bg-[#3B82F6] text-white"
                            : "bg-[#0A3563] text-[#3B82F6]"
                        }`}
                      >
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-4 text-slate-300 leading-8 border-t border-white/10">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.08)]">
              <p className="text-red-400 font-bold mb-4 tracking-widest">
                PLATFORM INFO
              </p>

              <div className="space-y-6">
                {sideInfo.map((item) => (
                  <div
                    key={item.label}
                    className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0"
                  >
                    <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                      {item.label}
                    </p>

                    <h3 className="font-bold flex items-center gap-2 mb-2">
                      {item.dot && (
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                      )}
                      {item.title}
                    </h3>

                    <p className="text-slate-400 text-sm leading-7">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0A3563] border border-[#134B78] rounded-3xl p-6">
              <p className="text-slate-400 text-xs font-bold tracking-widest mb-2">
                REPORT
              </p>

              <h3 className="text-xl font-bold mb-3">
                هل لديك معلومة ميدانية؟
              </h3>

              <p className="text-slate-300 leading-7 mb-5">
                يمكنك إرسال بلاغ أو تصحيح ليتم مراجعته ومتابعته من فريق
                المنصة.
              </p>

              <a
                href="/report"
                className="block text-center bg-[#3B82F6] hover:bg-[#2563EB] transition rounded-xl px-5 py-3 font-bold"
              >
                إرسال بلاغ
              </a>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-3xl p-6">
              <p className="text-white/80 text-xs font-bold tracking-widest mb-2">
                SUPPORT
              </p>

              <h3 className="text-xl font-bold mb-3">
                ساهم في استمرارية المشروع
              </h3>

              <p className="text-white/90 leading-7 mb-5">
                دعمكم يساعدنا في تغطية تكاليف الخوادم وتطوير خدمات
                التنبيهات.
              </p>

              <a
                href="/donate"
                className="block text-center bg-white text-red-600 hover:bg-slate-100 transition rounded-xl px-5 py-3 font-bold"
              >
                دعم المشروع
              </a>
            </div>

            <div className="bg-[#021B3A] border border-[#134B78] rounded-3xl p-6">
              <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                COMMUNITY
              </p>

              <h3 className="text-xl font-bold mb-3">
                تابع التنبيهات أولًا بأول
              </h3>

              <p className="text-slate-400 leading-7 mb-5">
                انضم إلى قنواتنا الرسمية لمتابعة آخر التحديثات والتنبيهات.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href="#"
                  className="text-center border border-[#134B78] hover:border-[#3B82F6] rounded-xl px-4 py-3 transition"
                >
                  Telegram
                </a>

                <a
                  href="#"
                  className="text-center border border-[#134B78] hover:border-[#3B82F6] rounded-xl px-4 py-3 transition"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

    <footer
    dir="ltr"
    className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-slate-500"
    >
    <div className="flex flex-wrap justify-center gap-3">
        <a href="/faq" className="hover:text-white transition">
        FAQ
        </a>

        <span>·</span>

        <a href="/terms" className="hover:text-white transition">
        Terms & Conditions
        </a>

        <span>·</span>

        <a href="/privacy" className="hover:text-white transition">
        Privacy Policy
        </a>

        <span>·</span>

        <span>
        © 2026 — by AlBayan Alert Map · All rights reserved
        </span>
    </div>
    </footer>
    </main>
  );
}
