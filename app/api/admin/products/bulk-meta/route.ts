import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

// Everything the bulk-add page needs up front: the real categories (so the
// AI can only pick ones that exist) and the prices you use most, for one-tap
// price chips.
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const [categories, products] = await Promise.all([
    Category.find().sort({ createdAt: 1 }).lean(),
    Product.find({}, { price: 1 }).lean()
  ]);

  const counts = new Map<number, number>();
  for (const p of products as any[]) {
    if (typeof p.price === "number") counts.set(p.price, (counts.get(p.price) ?? 0) + 1);
  }
  const commonPrices = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([price]) => price)
    .sort((a, b) => a - b);

  return NextResponse.json({
    categories: (categories as any[]).map((c) => ({ _id: String(c._id), slug: c.slug, label: c.label })),
    commonPrices
  });
}
