import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryRow from "@/components/CategoryRow";
import { getCategories, getActiveProducts } from "@/lib/catalog";

// This page reads Mongo directly (not via fetch), so Next.js would otherwise
// statically generate it once at build time and freeze it there — any product
// added through admin afterward wouldn't show up until the next deploy.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, products] = await Promise.all([getCategories(), getActiveProducts()]);

  return (
    <>
      <Header />
      <main>
        <section className="max-w-content mx-auto px-5 pt-14 pb-10">
          <h1 className="text-4xl sm:text-5xl max-w-xl leading-[1.1]">
            Gifts worth sending.
          </h1>
          <p className="mt-4 text-ink/60 max-w-md">
            Flowers, keepsakes, and custom pieces, delivered same day or made to order.
          </p>

          {categories.length > 0 && (
            <div className="mt-8 overflow-hidden">
              <div className="flex gap-3 w-max animate-marquee">
                {[...categories, ...categories].map((c, i) => (
                  <a
                    key={`${c.slug}-${i}`}
                    href={`/category/${c.slug}`}
                    className="text-sm border border-ink px-4 py-2 whitespace-nowrap hover:bg-ink hover:text-paper transition-colors"
                  >
                    {c.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        {products.length === 0 ? (
          <section className="max-w-content mx-auto px-5 py-20 text-center border-t border-line">
            <p className="text-ink/60">No products yet.</p>
            <p className="text-sm text-ink/40 mt-1">Add some from the admin dashboard to see them here.</p>
          </section>
        ) : (
          categories.map((c) => (
            <CategoryRow
              key={c.slug}
              label={c.label}
              slug={c.slug}
              items={products.filter((p) => p.category === c.slug)}
            />
          ))
        )}
      </main>
      <Footer />
    </>
  );
}
