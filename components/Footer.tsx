import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-content mx-auto px-5 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <img src="/logo-mark.png" alt="" className="h-7 w-auto" />
          <img src="/logo-wordmark.png" alt="Baron-Quinn" className="h-3.5 w-auto mt-1.5" />
        </div>
        <div className="flex gap-6 text-sm text-ink/60">
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/support" className="hover:text-ink">Support</Link>
        </div>
      </div>
    </footer>
  );
}