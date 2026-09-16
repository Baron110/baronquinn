import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-content mx-auto px-5 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="font-display text-lg">Baronquinn</p>
        <div className="flex gap-6 text-sm text-ink/60">
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/support" className="hover:text-ink">Support</Link>
        </div>
      </div>
    </footer>
  );
}
