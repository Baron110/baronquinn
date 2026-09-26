import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { resolveTracking } from "@/lib/tracking/trackingService";

export async function POST(req: NextRequest, { params }: { params: { reference: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { trackingNumber, carrierCode } = await req.json();
  if (!trackingNumber?.trim()) {
    return NextResponse.json({ error: "Tracking number is required" }, { status: 400 });
  }

  await connectDB();
  const order = await Order.findOne({ reference: params.reference });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let resolved;
  try {
    resolved = await resolveTracking(trackingNumber, carrierCode);
  } catch (err) {
    console.error("Tracking sync failed:", err);
    return NextResponse.json({ error: "Could not reach the tracking providers" }, { status: 502 });
  }

  if (!resolved) {
    return NextResponse.json(
      { error: "Neither provider has anything for this number yet — it may be too new, or check the number." },
      { status: 404 }
    );
  }

  // A fresh sync replaces the timeline with the current real state, rather
  // than appending — the tracking number is the authoritative source once
  // it's attached. Any one-off manual note can still be added afterward
  // through the regular "Add update" form.
  order.tracking = {
    realTrackingNumber: trackingNumber.trim().toUpperCase(),
    updates: resolved.events.map((e) => ({
      status: e.description,
      location: e.location || undefined,
      timestamp: new Date(e.timestamp)
    }))
  };
  await order.save();

  return NextResponse.json({ tracking: order.tracking, statusLabel: resolved.statusLabel });
}
