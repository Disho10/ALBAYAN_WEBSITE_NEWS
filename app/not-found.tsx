import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0D1B2A] text-white flex items-center justify-center p-6" dir="rtl">
      <div className="text-center max-w-md">
        <div className="text-6xl font-black text-[#E53935] mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">الصفحة غير موجودة</h1>
        <p className="text-[#94A3B8] mb-8">الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.</p>
        <Link href="/" className="inline-block bg-[#E53935] hover:bg-[#C62828] transition rounded-lg px-6 py-3 font-bold">العودة إلى الخريطة</Link>
      </div>
    </main>
  );
}
