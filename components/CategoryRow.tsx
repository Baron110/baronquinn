import Link from "next/link";
import { ProductDTO } from "@/lib/types";
import ProductCard from "./ProductCard";
import Marquee from "./Marquee";

export default function CategoryRow({
  label,
  slug,
  items
}: {
  label: string;
  slug: string;
  items: ProductDTO[];
}) {
  if (items.length === 0) return null;

  // Auto-scrolls horizontally, right to left — but it's a real scrollable
  // container (not just a CSS animation), so swiping or dragging it by hand
  // works too and just pauses the automatic motion for a couple seconds.
  const shouldScroll = items.length > 1;

  return (
    <section className="max-w-content mx-auto px-5 py-10 border-t border-line">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-2xl">{label}</h2>
        <Link href={`/category/${slug}`} className="text-sm underline underline-offset-4 hover:opacity-60">
          View all
        </Link>
      </div>

      {shouldScroll ? (
        <Marquee speed={25}>
          <div className="flex gap-5 w-max">
            {[...items, ...items].map((p, i) => (
              <div key={`${p.slug}-${i}`} className="w-40 sm:w-52 shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </Marquee>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
