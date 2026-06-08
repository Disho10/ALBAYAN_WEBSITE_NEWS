import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-deep)", color: "var(--text)" }} dir="rtl">
      <div className="text-center max-w-md">
        <div className="text-6xl font-black mb-4" style={{ color: "var(--accent)" }}>404</div>
        <h1 className="text-2xl font-bold mb-2">الصفحة غير موجودة</h1>
        <p className="mb-8" style={{ color: "var(--text-secondary)" }}>الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.</p>
        <Link href="/" className="inline-block transition rounded-lg px-6 py-3 font-bold text-white" style={{ background: "var(--accent)" }}>العودة إلى الخريطة</Link>
      </div>
    </main>
  );
}
