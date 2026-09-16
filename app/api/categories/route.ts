import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import { CategoryDTO } from "@/lib/types";

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
