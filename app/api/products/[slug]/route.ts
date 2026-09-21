import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { ProductDTO } from "@/lib/types";

void Category;

export const revalidate = 45;

function toDTO(p: any): ProductDTO {
  return {
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
  };
}

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  await connectDB();

  const product = await Product.findOne({ slug: params.slug, active: true }).populate("category").lean();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const related = await Product.find({
    active: true,
    slug: { $ne: params.slug },
    category: (product as any).category?._id
  })
    .populate("category")
    .limit(3)
    .lean();

  return NextResponse.json({
    product: toDTO(product),
    related: related.map(toDTO)
  });
}
