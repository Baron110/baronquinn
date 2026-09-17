import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { ProductDTO } from "@/lib/types";

// Referenced so the Category model is registered before Product's populate() runs
// (Next's route-level module isolation can otherwise skip this registration).
void Category;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectDB();

  const categorySlug = req.nextUrl.searchParams.get("category");
  const filter: Record<string, unknown> = { active: true };

  if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) return NextResponse.json([]);
    filter.category = category._id;
  }

  const products = await Product.find(filter).populate("category").sort({ createdAt: -1 }).lean();

  const dto: ProductDTO[] = products.map((p: any) => ({
    id: p._id.toString(),
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    compareAt: p.compareAt,
    category: p.category?.slug ?? "",
    categoryLabel: p.category?.label ?? "",
    images: p.images,
    duration: p.duration,
    isCustomized: p.isCustomized,
    badge: p.badge
  }));

  return NextResponse.json(dto);
}
