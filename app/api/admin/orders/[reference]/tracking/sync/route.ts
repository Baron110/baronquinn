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

  // Say plainly when a key is missing instead of letting it surface as
  // "nothing found" — the two look identical from the outside otherwise.
  const missing = [
    !process.env.TRACK17_API_KEY && "TRACK17_API_KEY",
    !process.env.TRACKINGMORE_API_KEY && "TRACKINGMORE_API_KEY"
  ].filter(Boolean);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `${missing.join(" and ")} not set on the server. Add ${missing.length > 1 ? "them" : "it"} in Vercel and redeploy.` },
      { status: 500 }
    );
  }

  let outcome;
  try {
    outcome = await resolveTracking(trackingNumber, carrierCode);
  } catch (err) {
    console.error("Tracking sync failed:", err);
    return NextResponse.json({ error: "Could not reach the tracking providers" }, { status: 502 });
  }

  if (!outcome.tracking) {
    const message = outcome.foundNoEvents
      ? `A provider recognises this number but I found no scan events in what it sent. If the carrier has already scanned it, my parsing is missing them. What they sent back: ${outcome.debug}`
      : `Neither provider returned usable data. What they sent back: ${outcome.debug}`;
    return NextResponse.json({ error: message }, { status: 404 });
  }

  const resolved = outcome.tracking;

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