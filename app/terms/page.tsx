import Link from "next/link";
import Footer from "@/app/components/Footer";

const termsSections = [
  {
    title: "1. قبول الشروط",
    text: "باستخدامك لمنصة AlBayan Alert Map أو تصفحك لأي من صفحاتها، فإنك تقر بأنك قرأت هذه الشروط والأحكام وفهمتها وتوافق على الالتزام بها بشكل كامل.",
  },
  {
    title: "2. طبيعة المنصة",
    text: "AlBayan Alert Map منصة ميدانية وإخبارية مستقلة تهدف إلى عرض التنبيهات والأحداث والتحديثات الميدانية بشكل سريع ومنظم، ولا تُعد جهة رسمية أو حكومية ما لم يُذكر ذلك صراحة.",
  },
  {
    title: "3. الاستخدام المقبول",
    text: "يلتزم المستخدم باستخدام المنصة بطريقة قانونية ومسؤولة، وعدم محاولة تعطيل الخدمة أو اختراقها أو إساءة استخدامها أو استغلالها لنشر معلومات كاذبة أو مضللة.",
  },
  {
    title: "4. دقة المعلومات",
    text: "نبذل جهدًا للتحقق من المعلومات قبل نشرها، إلا أن بعض التنبيهات قد تكون أولية أو قيد المتابعة، ولا نضمن أن تكون جميع المعلومات دقيقة أو مكتملة أو محدثة في جميع الأوقات.",
  },
  {
    title: "5. البلاغات المرسلة",
    text: "يتحمل المستخدم المسؤولية الكاملة عن أي بلاغ أو صورة أو وصف أو معلومة يقوم بإرسالها، وتحتفظ المنصة بحق مراجعة أو رفض أو حذف أي محتوى مخالف أو غير مناسب.",
  },
  {
    title: "6. إساءة استخدام البلاغات",
    text: "يُمنع إرسال بلاغات كاذبة أو متعمدة أو مضللة بهدف نشر الذعر أو الشائعات أو الإضرار بالآخرين، ويحق للمنصة حظر أو تجاهل أي مصدر يثبت سوء استخدامه.",
  },
  {
    title: "7. الاعتماد على المعلومات",
    text: "المعلومات المنشورة على المنصة لا تُعد بديلًا عن التعليمات الرسمية الصادرة عن الجهات المختصة أو خدمات الطوارئ. يتحمل المستخدم مسؤولية قراراته بناءً على المعلومات المتاحة.",
  },
  {
    title: "8. المحتوى وحقوق النشر",
    text: "جميع الشعارات والتصاميم والنصوص والخرائط والمحتوى الخاص بالمنصة محمية بحقوق الملكية الفكرية، ولا يجوز نسخها أو إعادة استخدامها بشكل كامل دون إذن مسبق.",
  },
  {
    title: "9. إعادة نشر المحتوى",
    text: "يُسمح بمشاركة التنبيهات والمعلومات مع الإشارة الواضحة إلى المصدر، ويُمنع حذف العلامات التعريفية أو إعادة نشر المحتوى بطريقة مضللة أو منسوبة لجهة أخرى.",
  },
  {
    title: "10. الروابط والخدمات الخارجية",
    text: "قد تحتوي المنصة على روابط إلى Telegram أو WhatsApp أو خدمات خرائط أو أدوات خارجية. نحن غير مسؤولين عن محتوى أو سياسات أو أعطال تلك الخدمات.",
  },
  {
    title: "11. التوفر واستمرارية الخدمة",
    text: "نسعى لتوفير الخدمة بشكل مستمر، لكننا لا نضمن عدم حدوث انقطاع مؤقت بسبب الصيانة أو الضغط أو الأعطال التقنية أو الظروف الخارجة عن السيطرة.",
  },
  {
    title: "12. حدود المسؤولية",
    text: "تُقدّم المنصة خدماتها كما هي دون أي ضمانات صريحة أو ضمنية، ولا تتحمل المنصة أو القائمون عليها أي مسؤولية عن أضرار مباشرة أو غير مباشرة ناتجة عن استخدام الموقع.",
  },
  {
    title: "13. حماية المجتمع",
    text: "تحتفظ المنصة بحق إزالة أي محتوى يتضمن تحريضًا أو إساءة أو انتهاكًا للخصوصية أو نشر معلومات شخصية أو أي محتوى قد يعرّض الأفراد أو المجتمع للخطر.",
  },
  {
    title: "14. تعليق أو تقييد الوصول",
    text: "يجوز للمنصة تقييد أو تعليق أو إنهاء وصول أي مستخدم إلى الخدمات في حال مخالفة الشروط أو إساءة استخدام المنصة أو محاولة الإضرار بعملها.",
  },
  {
    title: "15. الدعم والتبرعات",
    text: "الدعم المقدم للمنصة اختياري بالكامل، ويُستخدم للمساهمة في تغطية تكاليف الخوادم، التطوير، الخرائط، وتحسين سرعة وصول التنبيهات. لا يُعد الدعم شراءً لخدمة أو ضمانًا لأي ميزة خاصة.",
  },
  {
    title: "16. تعديل الشروط",
    text: "قد يتم تحديث هذه الشروط والأحكام في أي وقت بما يتناسب مع تطوير المنصة أو تغيير الخدمات. استمرار استخدام الموقع بعد التحديث يعني قبول النسخة الجديدة.",
  },
  {
    title: "17. التواصل معنا",
    text: "لأي استفسار حول هذه الشروط والأحكام، يمكن التواصل معنا عبر القنوات الرسمية الخاصة بـ AlBayan Alert Map.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#00152D] text-white p-6" dir="rtl">
      <section className="max-w-6xl mx-auto">
        <Link href="/" className="text-[#3B82F6] font-bold hover:text-white transition">
          العودة للخريطة
        </Link>

        <div className="mt-10 mb-10 text-center">
          <p className="text-red-400 font-bold mb-3 tracking-widest">
            — TERMS CENTER
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            الشروط والأحكام
          </h1>

          <p className="text-slate-300 leading-8 max-w-3xl mx-auto">
            باستخدامك لمنصة AlBayan Alert Map فإنك توافق على الالتزام بهذه
            الشروط، والتي توضّح قواعد استخدام المنصة، حدود المسؤولية، سياسة
            البلاغات، وحقوق المحتوى والدعم.
          </p>

          <div className="mt-6 inline-block bg-[#021B3A] border border-[#134B78] rounded-xl px-5 py-3 text-slate-300">
            آخر تحديث: يونيو 2026
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">⚖️</div>
            <h3 className="font-bold mb-1">استخدام مسؤول</h3>
            <p className="text-slate-400 text-sm">
              استخدام المنصة يجب أن يكون قانونيًا وغير مسيء.
            </p>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🚨</div>
            <h3 className="font-bold mb-1">بلاغات موثوقة</h3>
            <p className="text-slate-400 text-sm">
              يمنع إرسال بلاغات مضللة أو غير صحيحة.
            </p>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-bold mb-1">حدود المسؤولية</h3>
            <p className="text-slate-400 text-sm">
              التنبيهات لا تغني عن التعليمات الرسمية.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-[#021B3A] border border-[#134B78] rounded-3xl p-6">
              <p className="text-red-400 font-bold mb-4 tracking-widest">
                TERMS INFO
              </p>

              <div className="space-y-5">
                <div className="border-b border-white/10 pb-4">
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    PLATFORM
                  </p>
                  <h3 className="font-bold">منصة مستقلة</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-7">
                    لا تمثل جهة رسمية أو حكومية إلا إذا ذُكر ذلك صراحة.
                  </p>
                </div>

                <div className="border-b border-white/10 pb-4">
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    CONTENT
                  </p>
                  <h3 className="font-bold">المعلومات قابلة للتحديث</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-7">
                    قد يتم تعديل أو حذف التنبيهات عند توفر معلومات جديدة.
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    RESPONSIBILITY
                  </p>
                  <h3 className="font-bold">استخدم المعلومات بحذر</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-7">
                    لا تعتمد على التنبيهات بدلًا من التعليمات الرسمية.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-3xl p-6">
              <p className="text-white/80 text-xs font-bold tracking-widest mb-2">
                SUPPORT
              </p>

              <h3 className="text-xl font-bold mb-3">
                ساهم في استمرارية المشروع
              </h3>

              <p className="text-white/90 leading-7 mb-5">
                دعمكم يساعدنا في تغطية تكاليف الخوادم وتطوير خدمات التنبيهات.
              </p>

              <Link
                href="/donate"
                className="block text-center bg-white text-red-600 hover:bg-slate-100 transition rounded-xl px-5 py-3 font-bold"
              >
                دعم المشروع
              </Link>
            </div>

            <div className="bg-[#0A3563] border border-[#134B78] rounded-3xl p-6">
              <p className="text-slate-400 text-xs font-bold tracking-widest mb-2">
                REPORT
              </p>

              <h3 className="text-xl font-bold mb-3">
                إرسال بلاغ أو تصحيح
              </h3>

              <p className="text-slate-300 leading-7 mb-5">
                يمكنك إرسال بلاغ أو ملاحظة ليتم مراجعتها ومتابعتها.
              </p>

              <Link
                href="/report"
                className="block text-center bg-[#3B82F6] hover:bg-[#2563EB] transition rounded-xl px-5 py-3 font-bold"
              >
                إرسال بلاغ
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-2 bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(59,130,246,0.12)]">
            <div className="text-center mb-8">
              <p className="text-[#3B82F6] font-bold mb-3 tracking-widest">
                TERMS DETAILS
              </p>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                قواعد استخدام المنصة
              </h2>

              <p className="text-slate-300 leading-8 max-w-2xl mx-auto">
                البنود التالية توضّح آلية استخدام الموقع، نشر البلاغات،
                إعادة استخدام المحتوى، وحدود مسؤولية المنصة.
              </p>
            </div>

            <div className="space-y-4">
              {termsSections.map((section) => (
                <div
                  key={section.title}
                  className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5 hover:border-[#3B82F6] transition"
                >
                  <h3 className="text-xl font-bold mb-3">{section.title}</h3>
                  <p className="text-slate-300 leading-8">{section.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
