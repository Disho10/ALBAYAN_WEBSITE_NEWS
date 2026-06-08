import Link from "next/link";
import Footer from "@/app/components/Footer";
import PageShell from "@/app/components/PageShell";

const privacySections = [
  { title: "1. مقدمة", text: "نحترم في AlBayan Alert Map خصوصية المستخدمين ونلتزم بالتعامل مع البيانات بأعلى قدر ممكن من المسؤولية والشفافية. توضح هذه السياسة كيفية التعامل مع المعلومات أثناء استخدام الموقع أو إرسال البلاغات أو التواصل معنا." },
  { title: "2. المعلومات التي قد نجمعها", text: "لا نطلب إنشاء حساب لاستخدام الخريطة. ومع ذلك، قد نتعامل مع بيانات عامة مثل نوع الجهاز، المتصفح، وقت الزيارة، الصفحات التي تم فتحها، أو أي معلومات يرسلها المستخدم طوعًا عبر البلاغات أو نماذج التواصل." },
  { title: "3. البلاغات والمحتوى المرسل", text: "عند إرسال بلاغ، قد يتم استخدام المعلومات المرسلة مثل المنطقة، نوع الحدث، الوصف، الصور أو وسائل التواصل، وذلك فقط بهدف المراجعة والتحقق والمتابعة وتحسين دقة التنبيهات." },
  { title: "4. استخدام المعلومات", text: "تُستخدم المعلومات لتحسين أداء الموقع، تطوير الخرائط، مراجعة البلاغات، منع إساءة الاستخدام، تحسين سرعة التنبيهات، والتواصل مع المرسل عند الحاجة إلى توضيحات إضافية." },
  { title: "5. الموقع الجغرافي", text: "لا نقوم بتتبع أو حفظ موقعك الجغرافي تلقائيًا. لا يتم استخدام الموقع إلا إذا اخترت مشاركته بنفسك أثناء إرسال بلاغ أو معلومة ميدانية." },
  { title: "6. عدم بيع البيانات", text: "لا نقوم ببيع أو تأجير أو مشاركة بيانات المستخدمين لأغراض تجارية أو إعلانية. أي معلومات يتم إرسالها إلينا تُستخدم فقط ضمن نطاق تشغيل المنصة وتحسين خدماتها." },
  { title: "7. مشاركة المعلومات مع أطراف خارجية", text: "قد نستخدم خدمات تقنية خارجية مثل الاستضافة، الخرائط، أدوات التحليل، أو منصات التواصل. هذه الخدمات قد تعالج بعض البيانات التقنية اللازمة لتشغيل الموقع وفق سياساتها الخاصة." },
  { title: "8. ملفات الكوكيز", text: "قد يستخدم الموقع ملفات تعريف الارتباط أو تقنيات مشابهة لتحسين تجربة الاستخدام، حفظ بعض التفضيلات، قياس الأداء، وفهم طريقة تفاعل الزوار مع المنصة." },
  { title: "9. حماية المعلومات", text: "نحرص على اتخاذ إجراءات معقولة لحماية المعلومات من الوصول غير المصرح به أو التعديل أو الحذف أو سوء الاستخدام. ومع ذلك، لا يمكن ضمان الأمان الكامل لأي خدمة تعمل عبر الإنترنت." },
  { title: "10. الاحتفاظ بالبيانات", text: "نحتفظ بالمعلومات فقط للمدة اللازمة لتشغيل المنصة، مراجعة البلاغات، تحسين الخدمات، منع إساءة الاستخدام، أو الالتزام بأي متطلبات قانونية عند الحاجة." },
  { title: "11. حقوق المستخدم", text: "يمكن للمستخدم طلب حذف أو تصحيح أي معلومات أرسلها إلينا متى كان ذلك ممكنًا تقنيًا وعمليًا، وذلك عبر وسائل التواصل الرسمية الخاصة بالمنصة." },
  { title: "12. الروابط الخارجية", text: "قد يحتوي الموقع على روابط إلى منصات خارجية مثل Telegram أو WhatsApp أو خدمات خرائط. نحن غير مسؤولين عن سياسات الخصوصية أو محتوى تلك المنصات." },
  { title: "13. تحديثات السياسة", text: "قد نقوم بتحديث سياسة الخصوصية من وقت لآخر بما يتناسب مع تطوير الموقع أو تغيير الخدمات. استمرار استخدام الموقع بعد نشر التحديثات يعني قبول النسخة المحدّثة." },
  { title: "14. التواصل معنا", text: "لأي استفسار حول سياسة الخصوصية أو طريقة التعامل مع البيانات، يمكنكم التواصل معنا عبر القنوات الرسمية الخاصة بـ AlBayan Alert Map." },
];

export default function PrivacyPage() {
  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>الخصوصية</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">سياسة الخصوصية</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          نلتزم بحماية خصوصية مستخدمي AlBayan Alert Map والتعامل مع البيانات بشفافية ومسؤولية.
        </p>
        <div className="mt-6 inline-block rounded-xl px-5 py-3" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          آخر تحديث: يونيو 2026
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "🔒", title: "حماية الخصوصية", desc: "لا نطلب إنشاء حساب لمتابعة الخريطة والتنبيهات." },
          { icon: "📍", title: "لا تتبع للموقع", desc: "لا يتم حفظ موقعك الجغرافي إلا بإذن صريح منك." },
          { icon: "🚫", title: "لا بيع للبيانات", desc: "لا نبيع أو نشارك بياناتكم لأغراض تجارية أو إعلانية." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
            <div className="text-3xl mb-2">{c.icon}</div>
            <h3 className="font-bold mb-1">{c.title}</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl p-6" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
            <p className="font-bold mb-4 tracking-widest text-xs" style={{ color: "var(--accent)" }}>معلومات</p>
            <div className="space-y-5">
              {[
                { label: "البيانات", title: "الحد الأدنى من البيانات", text: "نتعامل مع أقل قدر ممكن من المعلومات لتشغيل الخدمة." },
                { label: "الأمان", title: "حماية معقولة", text: "نحرص على تطبيق إجراءات أمنية مناسبة للمعلومات." },
                { label: "الشفافية", title: "سياسة واضحة", text: "نوضح بشكل كامل كيف نتعامل مع أي بيانات." },
              ].map((item) => (
                <div key={item.label} className="pb-4 last:pb-0 last:border-b-0" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm mt-2 leading-7" style={{ color: "var(--text-secondary)" }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-6 bg-gradient-to-br from-red-600 to-red-700 text-white">
            <h3 className="text-lg font-bold mb-3">ساهم في استمرارية المشروع</h3>
            <p className="text-white/90 leading-7 mb-5">دعمكم يساعدنا في تغطية تكاليف الخوادم وتطوير خدمات التنبيهات.</p>
            <Link href="/donate" className="block text-center bg-white text-red-600 hover:bg-slate-100 transition rounded-xl px-5 py-3 font-bold">دعم المشروع</Link>
          </div>
        </aside>

        <div className="lg:col-span-2 rounded-2xl p-6 md:p-8" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="text-center mb-8">
            <p className="font-bold mb-3 tracking-widest text-xs" style={{ color: "var(--accent)" }}>البنود التفصيلية</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">تفاصيل سياسة الخصوصية</h2>
          </div>
          <div className="space-y-4">
            {privacySections.map((section) => (
              <div key={section.title} className="rounded-xl p-5 transition" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <h3 className="text-lg font-bold mb-3">{section.title}</h3>
                <p className="leading-8" style={{ color: "var(--text-secondary)" }}>{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </PageShell>
  );
}
