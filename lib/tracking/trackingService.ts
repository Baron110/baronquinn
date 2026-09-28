import { register17Track, get17Track } from "./track17Client";
import { getTrackingMore } from "./trackingMoreClient";
import { sanitizeDescription, sanitizeLocation } from "./sanitizer";
import { ResolvedTracking, ResolvedTrackingEvent, TrackingStatus, getStatusLabel } from "./types";

type Parsed = {
  status: TrackingStatus;
  origin: string;
  destination: string;
  estimatedDelivery: string | null;
  events: ResolvedTrackingEvent[];
};

function parse17Track(raw: any): Parsed | null {
  const info = raw?.data?.accepted?.[0]?.track_info;
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

function parseTrackingMore(raw: any): Parsed | null {
  const item = raw?.get?.data?.items?.[0];
  if (!item) return null;

  const rawEvents: any[] = item?.origin_info?.trackinfo ?? item?.tracking_detail ?? [];
  const events: ResolvedTrackingEvent[] = rawEvents.map((e: any) => ({
    timestamp: e.checkpoint_date ?? e.date ?? new Date().toISOString(),
    description: sanitizeDescription(e.tracking_detail ?? e.description ?? e.status_description ?? ""),
    location: sanitizeLocation(e.location ?? "")
  }));

  const sub = (item?.status ?? item?.delivery_status ?? "").toLowerCase();
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
    origin: item?.origin_info?.country ?? item?.country ?? "",
    destination: item?.destination_info?.country ?? "",
    estimatedDelivery: item?.scheduled_delivery_date ?? null,
    events
  };
}

function short(value: unknown): string {
  const s = JSON.stringify(value) ?? "null";
  return s.length > 350 ? s.slice(0, 350) + "…" : s;
}

export type ResolveOutcome = {
  tracking: ResolvedTracking | null;
  // A provider recognised the number but has no scan events yet.
  foundNoEvents: boolean;
  // Short, admin-only summary of what each provider actually returned.
  debug: string;
};

// Tries both providers in parallel and keeps whichever returned more event
// history — TrackingMore's free tier is known to sometimes give back only
// the latest checkpoint, so trusting one provider blindly isn't safe.
export async function resolveTracking(trackingNumber: string, carrierCode?: string): Promise<ResolveOutcome> {
  const clean = trackingNumber.trim().toUpperCase();

  await register17Track(clean);

  const [raw17, rawTM] = await Promise.all([
    get17Track(clean).catch((err) => {
      console.error("[tracking] 17TRACK failed:", err);
      return { error: String(err) };
    }),
    getTrackingMore(clean, carrierCode).catch((err) => {
      console.error("[tracking] TrackingMore failed:", err);
      return { error: String(err) };
    })
  ]);

  console.log("[tracking] 17TRACK raw:", JSON.stringify(raw17));
  console.log("[tracking] TrackingMore raw:", JSON.stringify(rawTM));

  const debug = `17TRACK → ${short(raw17)}  |  TrackingMore → ${short(rawTM)}`;

  const parsed17 = parse17Track(raw17);
  const parsedTM = parseTrackingMore(rawTM);

  const best = (parsed17?.events.length ?? 0) >= (parsedTM?.events.length ?? 0) ? parsed17 : parsedTM;

  if (!best) return { tracking: null, foundNoEvents: false, debug };
  if (best.events.length === 0) return { tracking: null, foundNoEvents: true, debug };

  return {
    tracking: {
      status: best.status,
      statusLabel: getStatusLabel(best.status),
      origin: best.origin,
      destination: best.destination,
      estimatedDelivery: best.estimatedDelivery,
      events: [...best.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    },
    foundNoEvents: false,
    debug
  };
}
