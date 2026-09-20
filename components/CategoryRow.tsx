import Link from "next/link";
import { ProductDTO } from "@/lib/types";
import ProductCard from "./ProductCard";

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

  // Auto-scrolls horizontally, right to left, same technique as the hero
  // pill marquee (duplicated content, looping translateX). Only worth
  // animating once there's more than one item.
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
        <div className="overflow-hidden">
          <div className="flex gap-5 w-max animate-marquee">
            {[...items, ...items].map((p, i) => (
              <div key={`${p.slug}-${i}`} className="w-40 sm:w-52 shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
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