import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import { CategoryDTO } from "@/lib/types";

// Without this, Next.js caches this route's first response at build time
// (it looked like a static GET with no per-request input) and keeps serving
// that same snapshot forever — which is exactly why the header showed
// "No categories yet." even after categories existed in Mongo.
export const revalidate = 45;

export async function GET() {
  await connectDB();
  const categories = await Category.find().sort({ createdAt: 1 }).lean();

  const dto: CategoryDTO[] = categories.map((c: any) => ({
    id: c._id.toString(),
    slug: c.slug,
    label: c.label,
    blurb: c.blurb
  }));

  return NextResponse.json(dto);
}
