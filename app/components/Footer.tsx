import Link from "next/link";

export default function Footer() {
  return (
    <footer dir="ltr" className="mt-16 pt-6 pb-6 text-center text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/faq" className="hover:opacity-80 transition">FAQ</Link>
        <span style={{ color: "var(--border)" }}>·</span>
        <Link href="/terms" className="hover:opacity-80 transition">Terms</Link>
        <span style={{ color: "var(--border)" }}>·</span>
        <Link href="/privacy" className="hover:opacity-80 transition">Privacy</Link>
        <span style={{ color: "var(--border)" }}>·</span>
        <span>© {new Date().getFullYear()} البيان الإخباري</span>
      </div>
    </footer>
  );
}
