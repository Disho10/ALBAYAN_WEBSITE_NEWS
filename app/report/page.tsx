import Link from "next/link";
import Footer from "@/app/components/Footer";
import PageShell from "@/app/components/PageShell";

export default function ReportPage() {
  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "#F59E0B" }}>الإبلاغ</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">الإبلاغ عن حدث ميداني</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          يمكنك إرسال خبر، صورة، فيديو، أو تصحيح عبر بوت الإبلاغ الرسمي. سيقوم فريقنا بمراجعة البلاغ والتحقق منه قبل نشره على الخريطة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "📩", title: "أرسل البلاغ", desc: "أرسل التفاصيل عبر البوت الرسمي." },
          { icon: "🔍", title: "نراجع المعلومات", desc: "تتم مراجعة البلاغ قبل نشره." },
          { icon: "🗺️", title: "يظهر على الخريطة", desc: "يتم نشر التنبيه بعد التحقق منه." },
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
            <p className="font-bold mb-4 tracking-widest text-xs" style={{ color: "#F59E0B" }}>معلومات البلاغ</p>
            <div className="space-y-5">
              <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>الحالة</p>
                <h3 className="font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />بوت الإبلاغ متاح
                </h3>
              </div>
              <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>المقبول</p>
                <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                  استقبال الأخبار الميدانية والمعلومات العاجلة والتحديثات المحلية من المراسلين والمستخدمين.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>المراجعة</p>
                <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                  لا يتم نشر كل البلاغات مباشرة، بل تتم مراجعتها قدر الإمكان قبل اعتمادها.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <h3 className="text-lg font-bold mb-3">أرسل معلومات واضحة</h3>
            <p className="leading-7" style={{ color: "var(--text-secondary)" }}>
              كلما كان البلاغ واضحًا ويتضمن منطقة، وقت، وصف، وصورة أو فيديو عند توفرها، ساعدنا ذلك على التحقق بشكل أسرع.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-gradient-to-br from-red-600 to-red-700 text-white">
            <h3 className="text-lg font-bold mb-3">ساهم في استمرارية المشروع</h3>
            <p className="text-white/90 leading-7 mb-5">دعمكم يساعدنا في تطوير الخريطة وتحسين سرعة وصول التنبيهات.</p>
            <Link href="/donate" className="block text-center bg-white text-red-600 hover:bg-slate-100 transition rounded-xl px-5 py-3 font-bold">دعم المشروع</Link>
          </div>
        </aside>

        <div className="lg:col-span-2 rounded-2xl p-6 md:p-8" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>⚠️</div>
            <p className="font-bold mb-3 tracking-widest text-xs" style={{ color: "var(--accent)" }}>بوت الإبلاغ</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">افتح بوت الإبلاغ الرسمي</h2>
            <p className="leading-8 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              اضغط على الزر أدناه للانتقال إلى بوت التلغرام وإرسال البلاغ مباشرة إلى فريق المتابعة.
            </p>
          </div>

          <div className="max-w-xl mx-auto rounded-2xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl p-4" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>نوع البلاغ</p>
                <p className="font-bold">أخبار وتنبيهات ميدانية</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "var(--bg-main)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>حالة النشر</p>
                <p className="font-bold">يتم التحقق قبل النشر</p>
              </div>
            </div>
            <a href="https://t.me/AlBayanReporterBot" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 transition rounded-2xl px-8 py-4 font-extrabold text-lg text-white">
              ⚠ فتح بوت الإبلاغ
            </a>
            <p className="text-sm mt-5 leading-7" style={{ color: "var(--text-secondary)" }}>
              الرجاء عدم إرسال بلاغات غير مؤكدة أو معلومات قد تسبب الذعر. نستخدم البلاغات فقط للمراجعة والمتابعة.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: "ما الذي يجب إرساله؟", a: "اسم المنطقة، نوع الحدث، الوقت التقريبي، وصف مختصر.." },
              { q: "متى يتم نشر البلاغ؟", a: "يتم نشر البلاغ عند توفر معلومات كافية وبعد مراجعته من فريق المنصة قدر الإمكان." },
            ].map((item) => (
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
