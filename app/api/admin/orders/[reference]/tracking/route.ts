import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(req: NextRequest, { params }: { params: { reference: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { status, location, note } = await req.json();
  if (!status?.trim()) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  await connectDB();
  const order = await Order.findOne({ reference: params.reference });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!order.tracking) order.tracking = { updates: [] };
  order.tracking.updates.push({
    status: status.trim(),
    location: location?.trim() || undefined,
    note: note?.trim() || undefined,
    timestamp: new Date()
  });
  await order.save();

  return NextResponse.json(order.tracking);
}

// Removes one update by its position in the list — for fixing a typo or a
// mistaken entry without having to delete and rebuild the whole timeline.
export async function DELETE(req: NextRequest, { params }: { params: { reference: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { index } = await req.json();

  await connectDB();
  const order = await Order.findOne({ reference: params.reference });
  if (!order || !order.tracking?.updates?.[index]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  order.tracking.updates.splice(index, 1);
  await order.save();

  return NextResponse.json(order.tracking);
}
