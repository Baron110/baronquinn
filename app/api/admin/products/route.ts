import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";

void Category;

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const products = await Product.find().populate("category").sort({ createdAt: -1 }).lean();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, description, price, compareAt, category, images, duration, isCustomized, badge } = body;

  if (!name || !price || !category) {
    return NextResponse.json({ error: "name, price, and category are required" }, { status: 400 });
  }

  await connectDB();

  let slug = slugify(name);
  const existing = await Product.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now().toString().slice(-4)}`;

  const product = await Product.create({
    name,
    slug,
    description: description ?? "",
    price,
    compareAt: compareAt || undefined,
    category,
    images: images ?? [],
    duration: duration || "1-2 days",
    isCustomized: !!isCustomized,
    badge: badge || undefined,
    active: true
  });

  return NextResponse.json(product);
}
