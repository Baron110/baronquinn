"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { CategoryDTO } from "@/lib/types";

export default function Header() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-line">
      <div className="max-w-content mx-auto px-5">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="font-display text-xl tracking-tight shrink-0">
            Baronquinn
          </Link>

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
  );
}
