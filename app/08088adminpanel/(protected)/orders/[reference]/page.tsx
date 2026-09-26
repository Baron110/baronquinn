"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/format";

type TrackingUpdate = { status: string; location?: string; note?: string; timestamp: string };

type OrderDetail = {
  reference: string;
  items: { productName: string; price: number; quantity: number }[];
  amount: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  sender: { name: string; email: string; phone: string };
  recipient: { name: string; phone?: string };
  address: { street: string; apartment?: string; city: string; state: string; country: string; zip?: string };
  createdAt: string;
  tracking?: { realTrackingNumber?: string; updates: TrackingUpdate[] };
};

const statusColor: Record<string, string> = {
  paid: "text-green-700",
  pending: "text-ink/50",
  failed: "text-red-700",
  cancelled: "text-ink/30"
};

// A starting menu, not a restriction — the status field below is free text,
// so anything specific to how you actually ship can just be typed in.
const STATUS_SUGGESTIONS = [
  "Order confirmed",
  "Preparing your order",
  "Shipped",
  "In transit",
  "Arrived in country",
  "Out for delivery",
  "Delivered"
];

export default function AdminOrderDetail({ params }: { params: { reference: string } }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrierCode, setCarrierCode] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  function load() {
    fetch(`/api/admin/orders/${params.reference}`)
      .then((r) => r.json())
      .then(setOrder)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.reference]);

  async function addUpdate() {
    if (!status.trim()) {
      setError("Status is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${params.reference}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, location, note })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add update.");
      setOrder((prev) => (prev ? { ...prev, tracking: data } : prev));
      setStatus("");
      setLocation("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function removeUpdate(index: number) {
    try {
      const res = await fetch(`/api/admin/orders/${params.reference}/tracking`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index })
      });
      const data = await res.json();
      if (res.ok) setOrder((prev) => (prev ? { ...prev, tracking: data } : prev));
    } catch {
      // leave the list as-is — the person can retry
    }
  }

  async function syncRealTracking() {
    if (!trackingNumber.trim()) {
      setSyncError("Enter a tracking number.");
      return;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/admin/orders/${params.reference}/tracking/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber, carrierCode: carrierCode || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not sync tracking.");
      setOrder((prev) => (prev ? { ...prev, tracking: data.tracking } : prev));
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) return <p className="text-ink/40">Loading...</p>;
  if (!order) return <p className="text-ink/40">Order not found.</p>;

  return (
    <div>
      <Link href="/08088adminpanel/orders" className="text-xs text-ink/50 hover:text-ink underline underline-offset-4">
        &larr; All orders
      </Link>

      <div className="flex items-start justify-between mt-4 mb-8 gap-4">
        <div>
          <h1 className="text-2xl">{order.reference}</h1>
          <p className="text-xs text-ink/40 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <p className={`text-sm capitalize ${statusColor[order.status]}`}>{order.status}</p>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-10">
        <section>
          <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-3">Items</h2>
          <div className="border border-line divide-y divide-line mb-8">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 text-sm">
                <span>
                  {item.productName}
                  {item.quantity > 1 && ` ×${item.quantity}`}
                </span>
                <span>{formatNaira(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 text-sm font-medium">
              <span>Total</span>
              <span>{formatNaira(order.amount)}</span>
            </div>
          </div>

          <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-3">Tracking updates</h2>

          <div className="border border-line p-4 mb-4 bg-bone">
            <p className="text-xs text-ink/50 mb-3">
              Have a real tracking number from the shipper? Sync it — this replaces the timeline below with
              the real, sanitized status (nothing about the origin ever reaches the customer). Costs one
              lookup against a monthly quota, so only sync when there's an actual update to pull.
            </p>
            <div className="grid sm:grid-cols-[1fr_140px_auto] gap-3">
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Tracking number"
                className="h-10 px-3 border border-line text-sm focus:outline-none focus:border-ink"
              />
              <input
                value={carrierCode}
                onChange={(e) => setCarrierCode(e.target.value)}
                placeholder="Carrier (optional)"
                className="h-10 px-3 border border-line text-sm focus:outline-none focus:border-ink"
              />
              <button
                onClick={syncRealTracking}
                disabled={syncing}
                className="h-10 px-5 border border-ink text-sm hover:bg-ink hover:text-paper disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Sync"}
              </button>
            </div>
            {syncError && <p className="text-xs text-red-700 mt-2">{syncError}</p>}
            {order.tracking?.realTrackingNumber && (
              <p className="text-xs text-ink/40 mt-2">Currently synced to {order.tracking.realTrackingNumber}</p>
            )}
          </div>

          <div className="border border-line p-4 mb-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink/50">Status</label>
                <input
                  list="status-suggestions"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="e.g. Out for delivery"
                  className="w-full h-10 px-3 border border-line text-sm mt-1 focus:outline-none focus:border-ink"
                />
                <datalist id="status-suggestions">
                  {STATUS_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-xs text-ink/50">Location (optional)</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lagos, Nigeria"
                  className="w-full h-10 px-3 border border-line text-sm mt-1 focus:outline-none focus:border-ink"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-ink/50">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Shown to the customer alongside this update"
                className="w-full h-10 px-3 border border-line text-sm mt-1 focus:outline-none focus:border-ink"
              />
            </div>
            {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
            <button
              onClick={addUpdate}
              disabled={saving}
              className="mt-3 h-10 px-5 bg-ink text-paper text-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add update"}
            </button>
          </div>

          {order.tracking?.updates && order.tracking.updates.length > 0 ? (
            <div className="border border-line divide-y divide-line">
              {[...order.tracking.updates]
                .map((u, i) => ({ ...u, originalIndex: i }))
                .reverse()
                .map((u) => (
                  <div key={u.originalIndex} className="p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm">{u.status}</p>
                      <p className="text-xs text-ink/40 mt-0.5">
                        {u.location && <>{u.location} &middot; </>}
                        {new Date(u.timestamp).toLocaleString()}
                      </p>
                      {u.note && <p className="text-xs text-ink/60 mt-1">{u.note}</p>}
                    </div>
                    <button
                      onClick={() => removeUpdate(u.originalIndex)}
                      className="text-xs text-red-700 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-ink/40">No tracking updates yet.</p>
          )}
        </section>

        <aside className="space-y-8">
          <div>
            <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-3">Recipient</h2>
            <p className="text-sm">{order.recipient.name}</p>
            {order.recipient.phone && <p className="text-sm text-ink/60 mt-0.5">{order.recipient.phone}</p>}
          </div>
          <div>
            <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-3">Delivery address</h2>
            <p className="text-sm text-ink/70 leading-relaxed">
              {order.address.street}
              {order.address.apartment && <>, {order.address.apartment}</>}
              <br />
              {order.address.city}, {order.address.state}
              <br />
              {order.address.country}
              {order.address.zip && <> {order.address.zip}</>}
            </p>
          </div>
          <div>
            <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-3">Sender</h2>
            <p className="text-sm text-ink/70">{order.sender.name}</p>
            <p className="text-sm text-ink/70">{order.sender.email}</p>
            <p className="text-sm text-ink/70">{order.sender.phone}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
