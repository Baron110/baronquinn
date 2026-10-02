import { MetadataRoute } from "next";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://baronquinn.com").trim().replace(/\/+$/, "");

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/support`, changeFrequency: "monthly", priority: 0.3 }
  ];

  try {
    await connectDB();
    const [categories, products] = await Promise.all([
      Category.find().select("slug").lean(),
      Product.find({ active: true }).select("slug").lean()
    ]);

    const categoryPages: MetadataRoute.Sitemap = categories.map((c: any) => ({
      url: `${base}/category/${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.7
    }));
    const productPages: MetadataRoute.Sitemap = products.map((p: any) => ({
      url: `${base}/product/${p.slug}`,
      changeFrequency: "weekly",
      priority: 0.6
    }));

    return [...staticPages, ...categoryPages, ...productPages];
  } catch (err) {
    // A broken DB connection shouldn't take the whole sitemap down — fall
    // back to just the static pages rather than erroring out entirely.
    console.error("Sitemap: could not load categories/products:", err);
    return staticPages;
  }
}
