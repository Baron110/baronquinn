"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { CategoryDTO, ProductDTO } from "@/lib/types";
import { formatNaira } from "@/lib/format";

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

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function Header() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, ProductDTO[]>>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/wallet")
        .then((r) => r.json())
        .then((data) => setWalletBalance(data.balance ?? 0))
        .catch(() => setWalletBalance(null));
    } else {
      setWalletBalance(null);
    }
  }, [status]);

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

  async function toggleCategory(slug: string) {
    if (expandedSlug === slug) {
      setExpandedSlug(null);
      return;
    }
    setExpandedSlug(slug);

    if (!productsByCategory[slug]) {
      setLoadingSlug(slug);
      try {
        const res = await fetch(`/api/products?category=${slug}`);
        const data: ProductDTO[] = await res.json();
        setProductsByCategory((prev) => ({ ...prev, [slug]: data }));
      } catch {
        setProductsByCategory((prev) => ({ ...prev, [slug]: [] }));
      } finally {
        setLoadingSlug(null);
      }
    }
  }

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
                  href="/08088adminpanel"
                  className="hidden sm:block text-sm border border-ink px-4 h-10 leading-10 hover:bg-ink hover:text-paper transition-colors"
                >
                  Admin
                </Link>
              )}

              {status === "authenticated" && walletBalance !== null && (
                <Link
                  href="/wallet"
                  className="text-xs sm:text-sm border border-ink px-3 sm:px-4 h-10 leading-10 hover:bg-ink hover:text-paper transition-colors"
                >
                  {formatNaira(walletBalance)}
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
                {categories.map((c) => {
                  const isOpen = expandedSlug === c.slug;
                  const products = productsByCategory[c.slug];

                  return (
                    <div key={c.slug} className={isOpen ? "bg-bone -mx-3 px-3" : ""}>
                      <button
                        onClick={() => toggleCategory(c.slug)}
                        className="w-full flex items-center justify-between h-12 text-sm hover:opacity-70 transition-opacity"
                      >
                        <span className="uppercase tracking-wide">{c.label}</span>
                        <ChevronDown open={isOpen} />
                      </button>

                      {isOpen && (
                        <div className="pb-3 pl-1 flex flex-col">
                          {loadingSlug === c.slug && (
                            <p className="text-xs text-ink/40 py-2">Loading...</p>
                          )}
                          {products?.length === 0 && loadingSlug !== c.slug && (
                            <p className="text-xs text-ink/40 py-2">No products in this category yet.</p>
                          )}
                          {products?.map((p) => (
                            <Link
                              key={p.slug}
                              href={`/product/${p.slug}`}
                              onClick={() => setMenuOpen(false)}
                              className="text-xs uppercase tracking-wide text-ink/70 py-2.5 hover:text-ink transition-colors"
                            >
                              {p.name}
                            </Link>
                          ))}
                          <Link
                            href={`/category/${c.slug}`}
                            onClick={() => setMenuOpen(false)}
                            className="text-xs text-ink/40 underline underline-offset-4 pt-1.5"
                          >
                            View all
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
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
