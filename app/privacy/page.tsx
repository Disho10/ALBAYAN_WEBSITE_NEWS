"use client";

import Footer from "@/app/components/Footer";
import PageShell from "@/app/components/PageShell";
import { useApp } from "@/app/components/ThemeProvider";

const sections = {
  ar: [
    { t: "مقدمة", b: "نحترم في AlBayan Alert Map خصوصية المستخدمين ونلتزم بالتعامل مع البيانات بأعلى قدر من المسؤولية والشفافية." },
    { t: "المعلومات التي قد نجمعها", b: "لا نطلب إنشاء حساب لاستخدام الخريطة. قد نتعامل مع بيانات عامة مثل نوع الجهاز، المتصفح، وقت الزيارة، أو أي معلومات يرسلها المستخدم طوعًا عبر البلاغات." },
    { t: "البلاغات والمحتوى المرسل", b: "عند إرسال بلاغ، قد يتم استخدام المعلومات المرسلة مثل المنطقة والوصف والصور فقط بهدف المراجعة والتحقق وتحسين دقة التنبيهات." },
    { t: "استخدام المعلومات", b: "تُستخدم المعلومات لتحسين أداء الموقع، تطوير الخرائط، مراجعة البلاغات، ومنع إساءة الاستخدام." },
    { t: "الموقع الجغرافي", b: "لا نقوم بتتبع أو حفظ موقعك الجغرافي تلقائيًا. لا يتم استخدام الموقع إلا إذا اخترت مشاركته بنفسك." },
    { t: "عدم بيع البيانات", b: "لا نقوم ببيع أو تأجير أو مشاركة بيانات المستخدمين لأغراض تجارية أو إعلانية." },
    { t: "الروابط الخارجية", b: "قد يحتوي الموقع على روابط إلى منصات خارجية. نحن غير مسؤولين عن سياسات الخصوصية أو محتوى تلك المنصات." },
    { t: "حماية المعلومات", b: "نحرص على اتخاذ إجراءات معقولة لحماية المعلومات من الوصول غير المصرح به." },
    { t: "حقوق المستخدم", b: "يمكن للمستخدم طلب حذف أو تصحيح أي معلومات أرسلها إلينا عبر وسائل التواصل الرسمية." },
    { t: "تحديثات السياسة", b: "قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. استمرار استخدام الموقع يعني قبول النسخة المحدّثة." },
  ],
  en: [
    { t: "Introduction", b: "At AlBayan Alert Map, we respect user privacy and are committed to handling data with the highest level of responsibility and transparency." },
    { t: "Information We May Collect", b: "We do not require account creation to use the map. We may process general data such as device type, browser, visit time, or any information voluntarily submitted by users through reports." },
    { t: "Submitted Reports", b: "When submitting a report, the information provided (such as region, description, and photos) may be used solely for review, verification, and improving alert accuracy." },
    { t: "Use of Information", b: "Information is used to improve site performance, develop maps, review reports, and prevent misuse." },
    { t: "Location Data", b: "We do not automatically track or save your geographic location. Location is only used if you choose to share it yourself." },
    { t: "No Data Sales", b: "We do not sell, rent, or share user data for commercial or advertising purposes." },
    { t: "External Links", b: "The site may contain links to external platforms. We are not responsible for the privacy policies or content of those platforms." },
    { t: "Information Protection", b: "We take reasonable measures to protect information from unauthorized access." },
    { t: "User Rights", b: "Users can request deletion or correction of any information they have sent to us through official communication channels." },
    { t: "Policy Updates", b: "We may update the privacy policy from time to time. Continued use of the site constitutes acceptance of the updated version." },
  ],
};

export default function PrivacyPage() {
  const { t, lang } = useApp();
  const isAr = lang === "ar";
  const items = isAr ? sections.ar : sections.en;

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>{t("privacy")}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          {isAr ? "نلتزم بحماية خصوصية مستخدمي AlBayan Alert Map والتعامل مع البيانات بشفافية." : "We are committed to protecting user privacy and handling data transparently."}
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
