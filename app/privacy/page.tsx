import Link from "next/link";
import Footer from "@/app/components/Footer";

const privacySections = [
  {
    title: "1. مقدمة",
    text: "نحترم في AlBayan Alert Map خصوصية المستخدمين ونلتزم بالتعامل مع البيانات بأعلى قدر ممكن من المسؤولية والشفافية. توضح هذه السياسة كيفية التعامل مع المعلومات أثناء استخدام الموقع أو إرسال البلاغات أو التواصل معنا.",
  },
  {
    title: "2. المعلومات التي قد نجمعها",
    text: "لا نطلب إنشاء حساب لاستخدام الخريطة. ومع ذلك، قد نتعامل مع بيانات عامة مثل نوع الجهاز، المتصفح، وقت الزيارة، الصفحات التي تم فتحها، أو أي معلومات يرسلها المستخدم طوعًا عبر البلاغات أو نماذج التواصل.",
  },
  {
    title: "3. البلاغات والمحتوى المرسل",
    text: "عند إرسال بلاغ، قد يتم استخدام المعلومات المرسلة مثل المنطقة، نوع الحدث، الوصف، الصور أو وسائل التواصل، وذلك فقط بهدف المراجعة والتحقق والمتابعة وتحسين دقة التنبيهات.",
  },
  {
    title: "4. استخدام المعلومات",
    text: "تُستخدم المعلومات لتحسين أداء الموقع، تطوير الخرائط، مراجعة البلاغات، منع إساءة الاستخدام، تحسين سرعة التنبيهات، والتواصل مع المرسل عند الحاجة إلى توضيحات إضافية.",
  },
  {
    title: "5. الموقع الجغرافي",
    text: "لا نقوم بتتبع أو حفظ موقعك الجغرافي تلقائيًا. لا يتم استخدام الموقع إلا إذا اخترت مشاركته بنفسك أثناء إرسال بلاغ أو معلومة ميدانية.",
  },
  {
    title: "6. عدم بيع البيانات",
    text: "لا نقوم ببيع أو تأجير أو مشاركة بيانات المستخدمين لأغراض تجارية أو إعلانية. أي معلومات يتم إرسالها إلينا تُستخدم فقط ضمن نطاق تشغيل المنصة وتحسين خدماتها.",
  },
  {
    title: "7. مشاركة المعلومات مع أطراف خارجية",
    text: "قد نستخدم خدمات تقنية خارجية مثل الاستضافة، الخرائط، أدوات التحليل، أو منصات التواصل. هذه الخدمات قد تعالج بعض البيانات التقنية اللازمة لتشغيل الموقع وفق سياساتها الخاصة.",
  },
  {
    title: "8. ملفات الكوكيز",
    text: "قد يستخدم الموقع ملفات تعريف الارتباط أو تقنيات مشابهة لتحسين تجربة الاستخدام، حفظ بعض التفضيلات، قياس الأداء، وفهم طريقة تفاعل الزوار مع المنصة.",
  },
  {
    title: "9. حماية المعلومات",
    text: "نحرص على اتخاذ إجراءات معقولة لحماية المعلومات من الوصول غير المصرح به أو التعديل أو الحذف أو سوء الاستخدام. ومع ذلك، لا يمكن ضمان الأمان الكامل لأي خدمة تعمل عبر الإنترنت.",
  },
  {
    title: "10. الاحتفاظ بالبيانات",
    text: "نحتفظ بالمعلومات فقط للمدة اللازمة لتشغيل المنصة، مراجعة البلاغات، تحسين الخدمات، منع إساءة الاستخدام، أو الالتزام بأي متطلبات قانونية عند الحاجة.",
  },
  {
    title: "11. حقوق المستخدم",
    text: "يمكن للمستخدم طلب حذف أو تصحيح أي معلومات أرسلها إلينا متى كان ذلك ممكنًا تقنيًا وعمليًا، وذلك عبر وسائل التواصل الرسمية الخاصة بالمنصة.",
  },
  {
    title: "12. الروابط الخارجية",
    text: "قد يحتوي الموقع على روابط إلى منصات خارجية مثل Telegram أو WhatsApp أو خدمات خرائط. نحن غير مسؤولين عن سياسات الخصوصية أو محتوى تلك المنصات.",
  },
  {
    title: "13. تحديثات السياسة",
    text: "قد نقوم بتحديث سياسة الخصوصية من وقت لآخر بما يتناسب مع تطوير الموقع أو تغيير الخدمات. استمرار استخدام الموقع بعد نشر التحديثات يعني قبول النسخة المحدّثة.",
  },
  {
    title: "14. التواصل معنا",
    text: "لأي استفسار حول سياسة الخصوصية أو طريقة التعامل مع البيانات، يمكنكم التواصل معنا عبر القنوات الرسمية الخاصة بـ AlBayan Alert Map.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#00152D] text-white p-6" dir="rtl">
      <section className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="text-[#3B82F6] font-bold hover:text-white transition"
        >
          العودة للخريطة
        </Link>

        <div className="mt-10 mb-10 text-center">
          <p className="text-red-400 font-bold mb-3 tracking-widest">
            — PRIVACY CENTER
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            سياسة الخصوصية
          </h1>

          <p className="text-slate-300 leading-8 max-w-3xl mx-auto">
            نلتزم بحماية خصوصية مستخدمي AlBayan Alert Map والتعامل مع
            البيانات بشفافية ومسؤولية، مع توضيح كيفية استخدام المعلومات
            المرتبطة بالخريطة والبلاغات والخدمات الميدانية.
          </p>

          <div className="mt-6 inline-block bg-[#021B3A] border border-[#134B78] rounded-xl px-5 py-3 text-slate-300">
            آخر تحديث: يونيو 2026
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-bold mb-1">حماية الخصوصية</h3>
            <p className="text-slate-400 text-sm">
              لا نطلب إنشاء حساب لمتابعة الخريطة والتنبيهات.
            </p>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">📍</div>
            <h3 className="font-bold mb-1">الموقع الجغرافي</h3>
            <p className="text-slate-400 text-sm">
              لا يتم حفظ موقعك إلا إذا شاركته بنفسك.
            </p>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-bold mb-1">عدم بيع البيانات</h3>
            <p className="text-slate-400 text-sm">
              لا نبيع بيانات المستخدمين لأي جهة تجارية.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-[#021B3A] border border-[#134B78] rounded-3xl p-6">
              <p className="text-red-400 font-bold mb-4 tracking-widest">
                PRIVACY INFO
              </p>

              <div className="space-y-5">
                <div className="border-b border-white/10 pb-4">
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    ACCOUNT
                  </p>
                  <h3 className="font-bold">لا حاجة لتسجيل الدخول</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-7">
                    يمكن استخدام الخريطة دون إنشاء حساب شخصي.
                  </p>
                </div>

                <div className="border-b border-white/10 pb-4">
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    LOCATION
                  </p>
                  <h3 className="font-bold">لا تتبع تلقائي للموقع</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-7">
                    الموقع لا يُحفظ إلا عند إرساله طوعًا ضمن بلاغ.
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    DATA
                  </p>
                  <h3 className="font-bold">لا بيع أو تأجير للبيانات</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-7">
                    نستخدم المعلومات فقط لتشغيل المنصة وتحسينها.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#0A3563] border border-[#134B78] rounded-3xl p-6">
              <p className="text-slate-400 text-xs font-bold tracking-widest mb-2">
                REQUEST
              </p>

              <h3 className="text-xl font-bold mb-3">
                طلب حذف أو تعديل بيانات
              </h3>

              <p className="text-slate-300 leading-7 mb-5">
                يمكنك التواصل معنا لطلب مراجعة أو حذف أي معلومات قمت بإرسالها.
              </p>

              <Link
                href="/report"
                className="block text-center bg-[#3B82F6] hover:bg-[#2563EB] transition rounded-xl px-5 py-3 font-bold"
              >
                تواصل معنا
              </Link>
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
                NOTICE
              </p>

              <h3 className="text-xl font-bold mb-3">
                استخدامك للمنصة يعني الموافقة
              </h3>

              <p className="text-slate-400 leading-7">
                استمرارك في استخدام الموقع يعني موافقتك على سياسة الخصوصية
                هذه وأي تحديثات لاحقة عليها.
              </p>
            </div>
          </aside>

          <div className="lg:col-span-2 bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(59,130,246,0.12)]">
            <div className="text-center mb-8">
              <p className="text-[#3B82F6] font-bold mb-3 tracking-widest">
                POLICY DETAILS
              </p>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                كيف نتعامل مع بياناتك؟
              </h2>

              <p className="text-slate-300 leading-8 max-w-2xl mx-auto">
                هذه البنود توضح نوع المعلومات التي قد نتعامل معها، ولماذا
                نستخدمها، وكيف نحافظ على خصوصية المستخدمين.
              </p>
            </div>

            <div className="space-y-4">
              {privacySections.map((section) => (
                <div
                  key={section.title}
                  className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5 hover:border-[#3B82F6] transition"
                >
                  <h3 className="text-xl font-bold mb-3">
                    {section.title}
                  </h3>

                  <p className="text-slate-300 leading-8">
                    {section.text}
                  </p>
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
