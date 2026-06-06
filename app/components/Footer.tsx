import Link from "next/link";

export default function Footer() {
  return (
    <footer
      dir="ltr"
      className="mt-16 border-t border-white/10 pt-6 pb-6 text-center text-sm text-slate-500"
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

        <span>© {new Date().getFullYear()} — AlBayan Alert Map · جميع الحقوق محفوظة</span>
      </div>
    </footer>
  );
}
