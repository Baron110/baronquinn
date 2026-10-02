import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-5 py-24 text-center">
        <p className="font-display text-5xl mb-4">404</p>
        <p className="text-ink/60 mb-8">That page doesn't exist, or it's moved.</p>
        <Link
          href="/"
          className="inline-block border border-ink px-6 py-3 text-sm hover:bg-ink hover:text-paper transition-colors"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
