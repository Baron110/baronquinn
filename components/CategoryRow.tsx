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

  // Gently auto-scrolls back and forth to hint there's more — a real
  // scrollable strip, so dragging/swiping it by hand works natively too.
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
        <Marquee speed={30}>
          {items.map((p) => (
            <div key={p.slug} className="w-40 sm:w-52 shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
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
