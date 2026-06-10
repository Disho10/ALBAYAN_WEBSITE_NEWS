"use client";

import Footer from "@/app/components/Footer";
import PageShell from "@/app/components/PageShell";
import { useApp } from "@/app/components/ThemeProvider";

const sections = {
  ar: [
    { t: "قبول الشروط", b: "باستخدامك لمنصة AlBayan Alert Map فإنك تقر بأنك قرأت هذه الشروط والأحكام وفهمتها وتوافق على الالتزام بها بشكل كامل." },
    { t: "طبيعة المنصة", b: "AlBayan Alert Map منصة ميدانية وإخبارية مستقلة تهدف إلى عرض التنبيهات والأحداث بشكل سريع ومنظم، ولا تُعد جهة رسمية أو حكومية." },
    { t: "الاستخدام المقبول", b: "يلتزم المستخدم باستخدام المنصة بطريقة قانونية ومسؤولة، وعدم محاولة تعطيل الخدمة أو اختراقها أو استغلالها لنشر معلومات كاذبة." },
    { t: "دقة المعلومات", b: "نبذل جهدًا للتحقق من المعلومات قبل نشرها، إلا أن بعض التنبيهات قد تكون أولية أو قيد المتابعة، ولا نضمن أن تكون جميع المعلومات دقيقة في جميع الأوقات." },
    { t: "البلاغات المرسلة", b: "يتحمل المستخدم المسؤولية الكاملة عن أي بلاغ أو معلومة يقوم بإرسالها، وتحتفظ المنصة بحق مراجعة أو رفض أو حذف أي محتوى مخالف." },
    { t: "إساءة استخدام البلاغات", b: "يُمنع إرسال بلاغات كاذبة أو متعمدة أو مضللة بهدف نشر الذعر أو الإضرار بالآخرين." },
    { t: "الاعتماد على المعلومات", b: "المعلومات المنشورة لا تُعد بديلًا عن التعليمات الرسمية الصادرة عن الجهات المختصة أو خدمات الطوارئ." },
    { t: "المحتوى وحقوق النشر", b: "جميع الشعارات والتصاميم والمحتوى الخاص بالمنصة محمية بحقوق الملكية الفكرية، ولا يجوز نسخها دون إذن مسبق." },
    { t: "حدود المسؤولية", b: "تُقدّم المنصة خدماتها كما هي دون ضمانات، ولا تتحمل أي مسؤولية عن أضرار ناتجة عن استخدام الموقع." },
    { t: "تعديل الشروط", b: "قد يتم تحديث هذه الشروط في أي وقت. استمرار استخدام الموقع بعد التحديث يعني قبول النسخة الجديدة." },
  ],
  en: [
    { t: "Acceptance of Terms", b: "By using AlBayan Alert Map, you acknowledge that you have read, understood, and agree to comply with these terms and conditions in full." },
    { t: "Nature of the Platform", b: "AlBayan Alert Map is an independent field and news platform that aims to display alerts and events quickly and in an organized manner. It is not an official or governmental entity." },
    { t: "Acceptable Use", b: "Users must use the platform in a lawful and responsible manner, and must not attempt to disrupt, hack, or exploit the service to spread false information." },
    { t: "Accuracy of Information", b: "We make efforts to verify information before publishing, but some alerts may be preliminary or under follow-up. We do not guarantee that all information is accurate at all times." },
    { t: "Submitted Reports", b: "Users bear full responsibility for any reports or information they submit. The platform reserves the right to review, reject, or delete any inappropriate content." },
    { t: "Misuse of Reports", b: "Submitting false, intentional, or misleading reports aimed at spreading panic or harming others is strictly prohibited." },
    { t: "Reliance on Information", b: "Published information is not a substitute for official instructions from relevant authorities or emergency services." },
    { t: "Content and Copyright", b: "All logos, designs, and content of the platform are protected by intellectual property rights and may not be copied without prior permission." },
    { t: "Limitation of Liability", b: "The platform provides its services as-is without warranties, and bears no responsibility for damages resulting from use of the website." },
    { t: "Modification of Terms", b: "These terms may be updated at any time. Continued use of the site after an update constitutes acceptance of the new version." },
  ],
};

export default function TermsPage() {
  const { t, lang } = useApp();
  const isAr = lang === "ar";
  const items = isAr ? sections.ar : sections.en;

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>{t("terms")}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{isAr ? "شروط استخدام المنصة" : "Terms of Use"}</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          {isAr ? "باستخدامك لمنصة AlBayan Alert Map فإنك توافق على الالتزام بهذه الشروط." : "By using AlBayan Alert Map, you agree to abide by these terms."}
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4 mb-12">
        {items.map((s, i) => (
          <div key={i} className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 className="text-lg font-bold mb-3">{i + 1}. {s.t}</h3>
            <p className="leading-8" style={{ color: "var(--text-secondary)" }}>{s.b}</p>
          </div>
        ))}
      </div>
      <Footer />
    </PageShell>
  );
}
