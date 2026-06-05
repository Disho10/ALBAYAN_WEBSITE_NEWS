import Link from "next/link";

export default function ReportPage() {
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
          <p className="text-orange-400 font-bold mb-3 tracking-widest">
            — REPORT CENTER
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            الإبلاغ عن حدث ميداني
          </h1>

          <p className="text-slate-300 leading-8 max-w-3xl mx-auto">
            يمكنك إرسال خبر، صورة، فيديو، أو تصحيح عبر بوت الإبلاغ الرسمي.
            سيقوم فريقنا بمراجعة البلاغ والتحقق منه قبل نشره على الخريطة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">📩</div>
            <h3 className="font-bold mb-1">أرسل البلاغ</h3>
            <p className="text-slate-400 text-sm">
              أرسل التفاصيل عبر البوت الرسمي.
            </p>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-bold mb-1">نراجع المعلومات</h3>
            <p className="text-slate-400 text-sm">
              تتم مراجعة البلاغ قبل نشره.
            </p>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🗺️</div>
            <h3 className="font-bold mb-1">يظهر على الخريطة</h3>
            <p className="text-slate-400 text-sm">
              يتم نشر التنبيه بعد التحقق منه.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-[#021B3A] border border-[#134B78] rounded-3xl p-6">
              <p className="text-orange-400 font-bold mb-4 tracking-widest">
                REPORT INFO
              </p>

              <div className="space-y-5">
                <div className="border-b border-white/10 pb-4">
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    STATUS
                  </p>
                  <h3 className="font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    بوت الإبلاغ متاح
                  </h3>
                </div>

                <div className="border-b border-white/10 pb-4">
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    ACCEPTED
                  </p>
                  <p className="text-slate-400 text-sm leading-7">
                    استقبال الأخبار الميدانية والمعلومات العاجلة والتحديثات المحلية من المراسلين والمستخدمين.
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    REVIEW
                  </p>
                  <p className="text-slate-400 text-sm leading-7">
                    لا يتم نشر كل البلاغات مباشرة، بل تتم مراجعتها قدر الإمكان
                    قبل اعتمادها.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#0A3563] border border-[#134B78] rounded-3xl p-6">
              <p className="text-slate-400 text-xs font-bold tracking-widest mb-2">
                IMPORTANT
              </p>

              <h3 className="text-xl font-bold mb-3">
                أرسل معلومات واضحة
              </h3>

              <p className="text-slate-300 leading-7">
                كلما كان البلاغ واضحًا ويتضمن منطقة، وقت، وصف، وصورة أو فيديو
                عند توفرها، ساعدنا ذلك على التحقق بشكل أسرع.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-3xl p-6">
              <p className="text-white/80 text-xs font-bold tracking-widest mb-2">
                SUPPORT
              </p>

              <h3 className="text-xl font-bold mb-3">
                ساهم في استمرارية المشروع
              </h3>

              <p className="text-white/90 leading-7 mb-5">
                دعمكم يساعدنا في تطوير الخريطة وتحسين سرعة وصول التنبيهات.
              </p>

              <Link
                href="/donate"
                className="block text-center bg-white text-red-600 hover:bg-slate-100 transition rounded-xl px-5 py-3 font-bold"
              >
                دعم المشروع
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-2 bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(59,130,246,0.12)]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-3xl">
                ⚠️
              </div>

              <p className="text-[#3B82F6] font-bold mb-3 tracking-widest">
                TELEGRAM REPORT BOT
              </p>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                افتح بوت الإبلاغ الرسمي
              </h2>

              <p className="text-slate-300 leading-8 max-w-2xl mx-auto">
                اضغط على الزر أدناه للانتقال إلى بوت التلغرام وإرسال البلاغ
                مباشرة إلى فريق المتابعة.
              </p>
            </div>

            <div className="max-w-xl mx-auto bg-[#001F3F] border border-[#134B78] rounded-3xl p-6 text-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#021B3A] border border-white/10 rounded-2xl p-4">
                  <p className="text-slate-500 text-xs font-bold mb-2">
                    نوع البلاغ
                  </p>
                  <p className="font-bold">أخبار وتنبيهات ميدانية</p>
                </div>

                <div className="bg-[#021B3A] border border-white/10 rounded-2xl p-4">
                  <p className="text-slate-500 text-xs font-bold mb-2">
                    حالة النشر
                  </p>
                  <p className="font-bold">يتم التحقق قبل النشر</p>
                </div>
              </div>

              <a
                href="https://t.me/AlBayanReporterBot"
                target="_blank"
                className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 transition rounded-2xl px-8 py-4 font-extrabold text-lg"
              >
                ⚠ فتح بوت الإبلاغ
              </a>

              <p className="text-slate-400 text-sm mt-5 leading-7">
                الرجاء عدم إرسال بلاغات غير مؤكدة أو معلومات قد تسبب الذعر.
                نستخدم البلاغات فقط للمراجعة والمتابعة.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5">
                <h3 className="font-bold mb-2">ما الذي يجب إرساله؟</h3>
                <p className="text-slate-400 leading-7 text-sm">
                  اسم المنطقة، نوع الحدث، الوقت التقريبي، وصف مختصر..
                </p>
              </div>

              <div className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5">
                <h3 className="font-bold mb-2">متى يتم نشر البلاغ؟</h3>
                <p className="text-slate-400 leading-7 text-sm">
                  يتم نشر البلاغ عند توفر معلومات كافية وبعد مراجعته من فريق
                  المنصة قدر الإمكان.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer
        dir="ltr"
        className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-slate-500"
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/faq" className="hover:text-white transition">
            FAQ
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-white transition">
            Terms & Conditions
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-white transition">
            Privacy Policy
          </Link>
          <span>·</span>
          <span>© 2026 — by AlBayan Alert Map · All rights reserved</span>
        </div>
      </footer>
    </main>
  );
}
