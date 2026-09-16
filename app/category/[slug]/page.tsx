import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { connectDB } from "@/lib/mongodb";
import CategoryModel from "@/models/Category";
import { getActiveProducts } from "@/lib/catalog";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  await connectDB();
  const category = await CategoryModel.findOne({ slug: params.slug }).lean();
  if (!category) return notFound();

  const allProducts = await getActiveProducts();
  const items = allProducts.filter((p) => p.category === params.slug);

  return (
    <>
      <Header />
      <main className="max-w-content mx-auto px-5 py-10">
        <h1 className="text-3xl">{(category as any).label}</h1>
        {(category as any).blurb && <p className="text-ink/60 mt-2">{(category as any).blurb}</p>}

        {items.length === 0 ? (
          <p className="text-ink/40 mt-10">No products in this category yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 mt-10">
            {items.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
