import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const categories = await Category.find().sort({ createdAt: 1 }).lean();
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { slug, label, blurb } = await req.json();
  if (!slug || !label) {
    return NextResponse.json({ error: "slug and label are required" }, { status: 400 });
  }

  await connectDB();
  const existing = await Category.findOne({ slug });
  if (existing) return NextResponse.json({ error: "That slug already exists" }, { status: 409 });

  const category = await Category.create({ slug, label, blurb });
  return NextResponse.json(category);
}
