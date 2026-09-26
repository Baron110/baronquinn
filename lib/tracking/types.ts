export type TrackingStatus =
  | "pending"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "expired"
  | "not_found";

export interface ResolvedTrackingEvent {
  timestamp: string; // ISO
  description: string;
  location: string;
}

export interface ResolvedTracking {
  status: TrackingStatus;
  statusLabel: string;
  origin: string;
  destination: string;
  estimatedDelivery: string | null;
  events: ResolvedTrackingEvent[]; // newest first
}

export function getStatusLabel(status: TrackingStatus): string {
  const labels: Record<TrackingStatus, string> = {
    pending: "Order confirmed",
    in_transit: "In transit",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    exception: "Delivery issue",
    expired: "Tracking expired",
    not_found: "Awaiting carrier update"
  };
  return labels[status];
}
