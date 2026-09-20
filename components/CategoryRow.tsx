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

  // Auto-scrolls vertically on its own, same technique as the hero pill
  // marquee (duplicated content, looping translateY). Only worth animating
  // once there's more than one item — otherwise it's just a static card.
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
        <div className="h-[420px] sm:h-[480px] lg:h-[520px] overflow-hidden">
          <div className="animate-marquee-vertical grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
            {[...items, ...items].map((p, i) => (
              <ProductCard key={`${p.slug}-${i}`} product={p} />
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
