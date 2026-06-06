"use client";

import Link from "next/link";
import Footer from "@/app/components/Footer";
import Image from "next/image";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function DonatePage() {
  const [copied, setCopied] = useState(false);

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
            — SUPPORT CENTER
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            بدعمكم نواصل إيصال الحقيقة
          </h1>

          <p className="text-slate-300 leading-8 max-w-3xl mx-auto">
            AlBayan Alert Map منصة ميدانية مستقلة تهدف إلى إيصال التنبيهات
            والتحديثات العاجلة بسرعة وموثوقية. يساهم دعمكم في تغطية تكاليف
            الخوادم، تطوير الخرائط، وتحسين سرعة وصول التنبيهات إلى الجميع.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🖥️</div>
            <h3 className="font-bold mb-1">تشغيل الخوادم</h3>
            <p className="text-slate-400 text-sm">
              دعمكم يساعدنا في إبقاء المنصة متاحة وسريعة.
            </p>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🗺️</div>
            <h3 className="font-bold mb-1">تطوير الخريطة</h3>
            <p className="text-slate-400 text-sm">
              تحسين تجربة المستخدم ودقة عرض المناطق والتنبيهات.
            </p>
          </div>

          <div className="bg-[#021B3A] border border-[#134B78] rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-bold mb-1">سرعة التنبيهات</h3>
            <p className="text-slate-400 text-sm">
              تسريع وصول التحديثات العاجلة إلى المستخدمين.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-[#021B3A] border border-[#134B78] rounded-3xl p-6">
              <p className="text-red-400 font-bold mb-4 tracking-widest">
                WHY SUPPORT?
              </p>

              <div className="space-y-5">
                <div className="border-b border-white/10 pb-4">
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    STATUS
                  </p>
                  <h3 className="font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    النظام يعمل بشكل طبيعي
                  </h3>
                </div>

                <div className="border-b border-white/10 pb-4">
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    COVERAGE
                  </p>
                  <h3 className="font-bold">لبنان — جميع المحافظات</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-7">
                    نعمل على تحسين التغطية حسب توفر المعلومات الميدانية.
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                    GOAL
                  </p>
                  <h3 className="font-bold">استمرارية المنصة</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-7">
                    كل مساهمة تساعد في تشغيل الخوادم وتطوير الخدمات.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#0A3563] border border-[#134B78] rounded-3xl p-6">
              <p className="text-slate-400 text-xs font-bold tracking-widest mb-2">
                REPORT
              </p>

              <h3 className="text-xl font-bold mb-3">
                لديك معلومة ميدانية؟
              </h3>

              <p className="text-slate-300 leading-7 mb-5">
                يمكنك إرسال بلاغ أو تصحيح ليتم مراجعته ومتابعته.
              </p>

              <Link
                href="/report"
                className="block text-center bg-[#3B82F6] hover:bg-[#2563EB] transition rounded-xl px-5 py-3 font-bold"
              >
                إرسال بلاغ
              </Link>
            </div>

            <div className="bg-[#021B3A] border border-[#134B78] rounded-3xl p-6">
              <p className="text-slate-500 text-xs font-bold tracking-widest mb-2">
                NOTE
              </p>

              <h3 className="text-xl font-bold mb-3">
                دعمكم يذهب لتطوير الخدمة
              </h3>

              <p className="text-slate-400 leading-7">
                المساهمات تساعد في تغطية التكاليف التقنية وتحسين أداء الخريطة
                وسرعة وصول التنبيهات.
              </p>
            </div>
          </aside>

          <div className="lg:col-span-2 bg-[#021B3A] border border-[#134B78] rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(59,130,246,0.12)]">
            <div className="text-center mb-8">
              <p className="text-[#3B82F6] font-bold mb-3 tracking-widest">
                DONATION METHOD
              </p>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                الدعم عبر Wish Money
              </h2>

              <p className="text-slate-300 leading-8 max-w-2xl mx-auto">
                يمكنك دعم المشروع عبر مسح رمز QR أو نسخ رقم التحويل وإرساله
                عبر Wish Money.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-[#0A3563] border border-[#134B78] rounded-3xl overflow-hidden">
              <div className="p-6 text-center border-b border-white/10">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
                  <Image
                    src="/wish-logo.jpg"
                    alt="Wish Money"
                    width={76}
                    height={76}
                    className="rounded-full"
                  />
                </div>

                <h3 className="text-2xl font-bold mb-2">
                  Wish Money
                </h3>

                <p className="text-slate-300 text-sm">
                  امسح الرمز أو استخدم رقم التحويل
                </p>
              </div>

              <div className="p-6">
                <h4 className="text-center text-slate-300 tracking-widest mb-5">
                  امسح رمز QR للتبرع
                </h4>

                <div className="bg-white rounded-2xl p-2 w-fit mx-auto">
                  <Image
                    src="/qr.png"
                    alt="QR Code"
                    width={185}
                    height={185}
                    className="contrast-200 brightness-0"
                  />
                </div>

                <div className="mt-6 bg-[#021B3A] border border-white/10 rounded-2xl py-4 px-4 text-center">
                  <p className="text-slate-400 text-sm mb-2">
                    رقم التحويل
                  </p>

                  <div className="text-2xl font-extrabold tracking-wide">
                    674 096 76 961+
                  </div>
                </div>

                <div className="flex justify-center mt-5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("+96176096674");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${
                      copied
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-[#3B82F6] hover:bg-[#2563EB]"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={18} />
                        تم النسخ
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        نسخ الرقم
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5">
                <h3 className="font-bold mb-2">لماذا نطلب الدعم؟</h3>
                <p className="text-slate-400 leading-7 text-sm">
                  لأن تشغيل الخريطة يحتاج إلى خوادم، تحديثات مستمرة، وتحسينات
                  تقنية لضمان وصول المعلومات بسرعة.
                </p>
              </div>

              <div className="bg-[#001F3F] border border-[#134B78] rounded-2xl p-5">
                <h3 className="font-bold mb-2">هل الدعم إلزامي؟</h3>
                <p className="text-slate-400 leading-7 text-sm">
                  لا، استخدام المنصة متاح للجميع. الدعم اختياري ويساعد فقط في
                  استمرار المشروع وتطويره.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
