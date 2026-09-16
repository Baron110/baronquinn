import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug } from "@/lib/catalog";
import { formatNaira } from "@/lib/format";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const data = await getProductBySlug(params.slug);
  if (!data) return notFound();

  const { product, related } = data;
  const image = product.images?.[0];

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-5 py-8">
        <Link href="/" className="text-sm text-ink/60 hover:text-ink">
          &larr; Back to home
        </Link>

        <div className="mt-6 grid md:grid-cols-2 gap-10">
          <div className="relative aspect-[4/5] bg-bone">
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-ink/20 text-sm">No photo</div>
            )}
          </div>

          <div className="max-w-md">
            <h1 className="text-3xl">{product.name}</h1>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-xl">{formatNaira(product.price)}</span>
              {product.compareAt && (
                <span className="text-sm text-ink/40 line-through">{formatNaira(product.compareAt)}</span>
              )}
            </div>

            <p className="text-sm text-ink/60 mt-4 leading-relaxed">{product.description}</p>

            <div className="mt-6 border-t border-b border-line py-4 text-sm flex justify-between">
              <span className="text-ink/60">Delivery</span>
              <span>{product.duration}</span>
            </div>
            <p className="text-xs text-ink/40 mt-3">Delivery to some locations may attract extra fees.</p>

            <Link
              href={`/checkout?product=${product.slug}`}
              className="mt-8 block text-center bg-ink text-paper py-4 hover:opacity-90 transition-opacity"
            >
              Purchase now
            </Link>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-line">
            <h2 className="text-2xl mb-5">You might also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-8">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
