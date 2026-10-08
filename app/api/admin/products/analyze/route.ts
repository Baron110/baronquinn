import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { analyzeProductImage } from "@/lib/productVision";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { image, mode, categories } = await req.json();

  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json({ error: "image (data URL) is required" }, { status: 400 });
  }
  if (mode !== "photo" && mode !== "screenshot") {
    return NextResponse.json({ error: "mode must be photo or screenshot" }, { status: 400 });
  }

  try {
    const result = await analyzeProductImage(image, mode, Array.isArray(categories) ? categories : []);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Product analyze failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Analysis failed" }, { status: 502 });
  }
}
