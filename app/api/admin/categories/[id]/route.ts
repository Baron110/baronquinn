import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();

  const inUse = await Product.exists({ category: params.id });
  if (inUse) {
    return NextResponse.json(
      { error: "Can't delete — products are still assigned to this category. Move or delete them first." },
      { status: 409 }
    );
  }

  const category = await Category.findByIdAndDelete(params.id);
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
