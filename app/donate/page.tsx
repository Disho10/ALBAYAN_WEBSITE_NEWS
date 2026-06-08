"use client";

import Link from "next/link";
import Footer from "@/app/components/Footer";
import PageShell from "@/app/components/PageShell";
import Image from "next/image";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function DonatePage() {
  const [copied, setCopied] = useState(false);

  return (
    <PageShell>
      <div className="mt-8 mb-10 text-center">
        <p className="font-bold mb-3 text-sm" style={{ color: "var(--accent)" }}>ادعمنا</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">بدعمكم نواصل إيصال الحقيقة</h1>
        <p className="leading-8 max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          AlBayan Alert Map منصة ميدانية مستقلة تهدف إلى إيصال التنبيهات والتحديثات العاجلة بسرعة وموثوقية.
          يساهم دعمكم في تغطية تكاليف الخوادم، تطوير الخرائط، وتحسين سرعة وصول التنبيهات إلى الجميع.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "🖥️", title: "تشغيل الخوادم", desc: "دعمكم يساعدنا في إبقاء المنصة متاحة وسريعة." },
          { icon: "🗺️", title: "تطوير الخريطة", desc: "تحسين تجربة المستخدم ودقة عرض المناطق والتنبيهات." },
          { icon: "⚡", title: "سرعة التنبيهات", desc: "تسريع وصول التحديثات العاجلة إلى المستخدمين." },
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
            <p className="font-bold mb-4 tracking-widest text-xs" style={{ color: "var(--accent)" }}>لماذا الدعم؟</p>
            <div className="space-y-5">
              <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>الحالة</p>
                <h3 className="font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />النظام يعمل بشكل طبيعي
                </h3>
              </div>
              <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>التغطية</p>
                <h3 className="font-bold">لبنان — جميع المحافظات</h3>
                <p className="text-sm mt-2 leading-7" style={{ color: "var(--text-secondary)" }}>نعمل على تحسين التغطية حسب توفر المعلومات الميدانية.</p>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>الهدف</p>
                <h3 className="font-bold">استمرارية المنصة</h3>
                <p className="text-sm mt-2 leading-7" style={{ color: "var(--text-secondary)" }}>كل مساهمة تساعد في تشغيل الخوادم وتطوير الخدمات.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <h3 className="text-lg font-bold mb-3">لديك معلومة ميدانية؟</h3>
            <p className="leading-7 mb-5" style={{ color: "var(--text-secondary)" }}>يمكنك إرسال بلاغ أو تصحيح ليتم مراجعته ومتابعته.</p>
            <Link href="/report" className="block text-center rounded-xl px-5 py-3 font-bold text-white" style={{ background: "var(--accent)" }}>إرسال بلاغ</Link>
          </div>
        </aside>

        <div className="lg:col-span-2 rounded-2xl p-6 md:p-8" style={{ background: "var(--bg-main)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="text-center mb-8">
            <p className="font-bold mb-3 tracking-widest text-xs" style={{ color: "var(--accent)" }}>طريقة الدعم</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">الدعم عبر Wish Money</h2>
            <p className="leading-8 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              يمكنك دعم المشروع عبر مسح رمز QR أو نسخ رقم التحويل وإرساله عبر Wish Money.
            </p>
          </div>

          <div className="max-w-md mx-auto rounded-2xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <div className="p-6 text-center" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
                <Image src="/wish-logo.jpg" alt="Wish Money" width={76} height={76} className="rounded-full" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Wish Money</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>امسح الرمز أو استخدم رقم التحويل</p>
            </div>

            <div className="p-6">
              <h4 className="text-center tracking-widest mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>امسح رمز QR للتبرع</h4>
              <div className="bg-white rounded-2xl p-2 w-fit mx-auto">
                <Image src="/qr.png" alt="QR Code" width={185} height={185} className="contrast-200 brightness-0" />
              </div>
              <div className="mt-6 rounded-2xl py-4 px-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>رقم التحويل</p>
                <div className="text-2xl font-extrabold tracking-wide">674 096 76 961+</div>
              </div>
              <div className="flex justify-center mt-5">
                <button onClick={() => { navigator.clipboard.writeText("+96176096674"); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition text-white ${copied ? "bg-green-600" : ""}`}
                  style={copied ? {} : { background: "var(--accent)" }}>
                  {copied ? <><Check size={18} />تم النسخ</> : <><Copy size={18} />نسخ الرقم</>}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: "لماذا نطلب الدعم؟", a: "لأن تشغيل الخريطة يحتاج إلى خوادم، تحديثات مستمرة، وتحسينات تقنية لضمان وصول المعلومات بسرعة." },
              { q: "هل الدعم إلزامي؟", a: "لا، استخدام المنصة متاح للجميع. الدعم اختياري ويساعد فقط في استمرار المشروع وتطويره." },
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
