import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { reference: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const order = await Order.findOne({ reference: params.reference }).lean();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(order);
}
