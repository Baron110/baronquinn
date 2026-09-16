import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json(orders);
}
