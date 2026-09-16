import { connectDB } from "./mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { ProductDTO, CategoryDTO } from "./types";

function productToDTO(p: any): ProductDTO {
  return {
    id: p._id.toString(),
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    compareAt: p.compareAt,
    category: p.category?.slug ?? "",
    categoryLabel: p.category?.label ?? "",
    images: p.images ?? [],
    duration: p.duration,
    isCustomized: p.isCustomized,
    badge: p.badge
  };
}

export async function getCategories(): Promise<CategoryDTO[]> {
  await connectDB();
  const categories = await Category.find().sort({ createdAt: 1 }).lean();
  return categories.map((c: any) => ({ id: c._id.toString(), slug: c.slug, label: c.label, blurb: c.blurb }));
}

export async function getActiveProducts(): Promise<ProductDTO[]> {
  await connectDB();
  const products = await Product.find({ active: true }).populate("category").sort({ createdAt: -1 }).lean();
  return products.map(productToDTO);
}

export async function getProductBySlug(slug: string) {
  await connectDB();
  const product = await Product.findOne({ slug, active: true }).populate("category").lean();
  if (!product) return null;

  const related = await Product.find({
    active: true,
    slug: { $ne: slug },
    category: (product as any).category?._id
  })
    .populate("category")
    .limit(3)
    .lean();

  return { product: productToDTO(product), related: related.map(productToDTO) };
}
