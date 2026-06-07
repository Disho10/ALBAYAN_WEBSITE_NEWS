import Link from "next/link";

export default function Footer() {
  return (
    <footer dir="ltr" className="mt-16 border-t border-[#243447] pt-6 pb-6 text-center text-xs text-[#64748B]">
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/faq" className="hover:text-white transition">FAQ</Link>
        <span className="text-[#243447]">·</span>
        <Link href="/terms" className="hover:text-white transition">Terms</Link>
        <span className="text-[#243447]">·</span>
        <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
        <span className="text-[#243447]">·</span>
        <span>© {new Date().getFullYear()} البيان الإخباري</span>
      </div>
    </footer>
  );
}
