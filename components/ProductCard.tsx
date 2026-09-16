import Image from "next/image";
import Link from "next/link";
import { ProductDTO } from "@/lib/types";
import { formatNaira } from "@/lib/format";

export default function ProductCard({ product }: { product: ProductDTO }) {
  const image = product.images?.[0];

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] bg-bone overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink/20 text-sm">No photo</div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-ink text-paper text-xs px-2 py-1">
            {product.badge}
          </span>
        )}
      </div>
      <div className="pt-3">
        <p className="text-sm">{product.name}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-sm font-medium">{formatNaira(product.price)}</span>
          {product.compareAt && (
            <span className="text-xs text-ink/40 line-through">{formatNaira(product.compareAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
