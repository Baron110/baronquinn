"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { CategoryDTO } from "@/lib/types";

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export default function Header() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-line">
        <div className="max-w-content mx-auto px-5">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                className="md:hidden w-9 h-9 flex items-center justify-center -ml-1.5"
              >
                <HamburgerIcon />
              </button>
              <Link href="/" className="font-display text-xl tracking-tight shrink-0">
                Baronquinn
              </Link>
            </div>

            <form action="/search" className="hidden sm:flex flex-1 max-w-md">
              <input
                type="search"
                name="q"
                placeholder="Search for a gift"
                className="w-full h-10 px-4 border border-line text-sm placeholder:text-ink/40 focus:outline-none focus:border-ink transition-colors"
              />
            </form>

            <div className="flex items-center gap-3 shrink-0">
              {session?.user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden sm:block text-sm border border-ink px-4 h-10 leading-10 hover:bg-ink hover:text-paper transition-colors"
                >
                  Admin
                </Link>
              )}

              {status === "authenticated" ? (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hidden sm:block text-sm border border-ink px-4 h-10 leading-10 hover:bg-ink hover:text-paper transition-colors"
                >
                  Log out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:block text-sm border border-ink px-4 h-10 leading-10 hover:bg-ink hover:text-paper transition-colors"
                >
                  Log in
                </Link>
              )}

              <Link
                href="/checkout"
                aria-label="Cart"
                className="w-10 h-10 flex items-center justify-center border border-ink text-lg"
              >
                🛒
              </Link>
            </div>
          </div>

          <nav className="hidden md:flex gap-6 h-11 items-center text-sm border-t border-line overflow-x-auto">
            {categories.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="whitespace-nowrap hover:opacity-60 transition-opacity">
                {c.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-paper flex flex-col">
            <div className="flex items-center justify-between h-16 px-5 border-b border-line shrink-0">
              <span className="font-display text-lg">Baronquinn</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="w-8 h-8 flex items-center justify-center">
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">Menu</p>
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 h-11 px-3 -mx-3 bg-bone text-sm"
              >
                <HomeIcon />
                Home
              </Link>

              <p className="text-xs uppercase tracking-wide text-ink/40 mt-6 mb-2">Collections</p>
              <div className="flex flex-col">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between h-12 px-3 -mx-3 text-sm hover:bg-bone transition-colors"
                  >
                    <span className="uppercase tracking-wide">{c.label}</span>
                    <ChevronRight />
                  </Link>
                ))}
                {categories.length === 0 && <p className="text-sm text-ink/40 px-3">No categories yet.</p>}
              </div>
            </div>

            <div className="shrink-0 border-t border-line p-5 flex gap-3">
              {status === "authenticated" ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex-1 h-11 border border-ink text-sm"
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 h-11 flex items-center justify-center border border-ink text-sm"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 h-11 flex items-center justify-center bg-ink text-paper text-sm"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
