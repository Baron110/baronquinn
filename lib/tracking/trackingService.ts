import { register17Track, get17Track } from "./track17Client";
import { getTrackingMore } from "./trackingMoreClient";
import { sanitizeDescription, sanitizeLocation } from "./sanitizer";
import { ResolvedTracking, ResolvedTrackingEvent, TrackingStatus, getStatusLabel } from "./types";

function parse17Track(raw: any): { status: TrackingStatus; origin: string; destination: string; estimatedDelivery: string | null; events: ResolvedTrackingEvent[] } | null {
  const info = raw?.track_info;
  if (!info) return null;

  const rawEvents: any[] = info?.tracking?.providers?.[0]?.events ?? [];
  const events: ResolvedTrackingEvent[] = rawEvents.map((e) => ({
    timestamp: e.time_iso ?? e.time_utc ?? new Date().toISOString(),
    description: sanitizeDescription(e.description ?? e.stage ?? ""),
    location: sanitizeLocation(e.location ?? "")
  }));

  const sub = (info?.latest_status?.status ?? "").toLowerCase();
  const status: TrackingStatus = sub.includes("delivered")
    ? "delivered"
    : sub.includes("out_for_delivery") || sub.includes("delivering")
    ? "out_for_delivery"
    : sub.includes("transit") || sub.includes("intransit")
    ? "in_transit"
    : sub.includes("exception") || sub.includes("expired") || sub.includes("failed")
    ? "exception"
    : "pending";

  return {
    status,
    origin: info?.misc_info?.origin_country ?? "",
    destination: info?.misc_info?.destination_country ?? "",
    estimatedDelivery: info?.time_metrics?.estimated_delivery_date?.to ?? null,
    events
  };
}

function parseTrackingMore(raw: any): { status: TrackingStatus; origin: string; destination: string; estimatedDelivery: string | null; events: ResolvedTrackingEvent[] } | null {
  if (!raw) return null;

  const rawEvents: any[] = raw?.origin_info?.trackinfo ?? raw?.tracking_detail ?? [];
  const events: ResolvedTrackingEvent[] = rawEvents.map((e: any) => ({
    timestamp: e.checkpoint_date ?? e.date ?? new Date().toISOString(),
    description: sanitizeDescription(e.tracking_detail ?? e.description ?? e.status_description ?? ""),
    location: sanitizeLocation(e.location ?? "")
  }));

  const sub = (raw?.status ?? raw?.delivery_status ?? "").toLowerCase();
  const status: TrackingStatus = sub.includes("delivered")
    ? "delivered"
    : sub.includes("out for delivery") || sub.includes("outfordelivery")
    ? "out_for_delivery"
    : sub.includes("transit") || sub.includes("pickup")
    ? "in_transit"
    : sub.includes("exception") || sub.includes("expired")
    ? "exception"
    : "pending";

  return {
    status,
    origin: raw?.origin_info?.country ?? raw?.country ?? "",
    destination: raw?.destination_info?.country ?? "",
    estimatedDelivery: raw?.scheduled_delivery_date ?? null,
    events
  };
}

// Tries both providers in parallel and keeps whichever actually returned
// more event history — TrackingMore's free tier is known to sometimes give
// back only the single latest checkpoint, so this is the real fix rather
// than trusting one provider blindly.
export async function resolveTracking(
  trackingNumber: string,
  carrierCode?: string
): Promise<ResolvedTracking | null> {
  const clean = trackingNumber.trim().toUpperCase();

  await register17Track(clean);

  const [raw17, rawTM] = await Promise.all([
    get17Track(clean).catch((err) => {
      console.error("[tracking] 17TRACK failed:", err);
      return null;
    }),
    getTrackingMore(clean, carrierCode).catch((err) => {
      console.error("[tracking] TrackingMore failed:", err);
      return null;
    })
  ]);

  console.log("[tracking] 17TRACK raw:", JSON.stringify(raw17));
  console.log("[tracking] TrackingMore raw:", JSON.stringify(rawTM));

  const parsed17 = parse17Track(raw17);
  const parsedTM = parseTrackingMore(rawTM);

  const best =
    (parsed17?.events.length ?? 0) >= (parsedTM?.events.length ?? 0) ? parsed17 : parsedTM;

  if (!best) return null;

  return {
    status: best.status,
    statusLabel: getStatusLabel(best.status),
    origin: best.origin,
    destination: best.destination,
    estimatedDelivery: best.estimatedDelivery,
    events: [...best.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  };
}
