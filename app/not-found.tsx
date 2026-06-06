import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="min-h-screen bg-[#00152D] text-white flex items-center justify-center p-6"
      dir="rtl"
    >
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🗺️</div>

        <h1 className="text-5xl font-extrabold mb-4">404</h1>

        <p className="text-xl text-slate-300 mb-2">الصفحة غير موجودة</p>

        <p className="text-slate-400 mb-8">
          الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.
        </p>

        <Link
          href="/"
          className="inline-block bg-[#3B82F6] hover:bg-[#2563EB] transition rounded-xl px-6 py-3 font-bold"
        >
          العودة إلى الخريطة
        </Link>
      </div>
    </main>
  );
}
