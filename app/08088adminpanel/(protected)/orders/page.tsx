"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/format";

type OrderItem = { productName: string; price: number; quantity: number };

type Order = {
  _id: string;
  items: OrderItem[];
  amount: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  sender: { name: string; email: string };
  recipient: { name: string };
  reference: string;
  createdAt: string;
};

const statusColor: Record<Order["status"], string> = {
  paid: "text-green-700",
  pending: "text-ink/50",
  failed: "text-red-700",
  cancelled: "text-ink/30"
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-3xl mb-6">Orders</h1>

      {loading ? (
        <p className="text-ink/40">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-ink/40">No orders yet.</p>
      ) : (
        <div className="border border-line overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-line text-left text-ink/50 text-xs uppercase tracking-wide">
                <th className="p-3">Date</th>
                <th className="p-3">Product</th>
                <th className="p-3">Sender</th>
                <th className="p-3">Recipient</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b border-line last:border-b-0">
                  <td className="p-3 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    {o.items.length === 1
                      ? `${o.items[0].productName}${o.items[0].quantity > 1 ? ` ×${o.items[0].quantity}` : ""}`
                      : `${o.items.length} items`}
                  </td>
                  <td className="p-3">
                    <p>{o.sender.name}</p>
                    <p className="text-xs text-ink/40">{o.sender.email}</p>
                  </td>
                  <td className="p-3">{o.recipient.name}</td>
                  <td className="p-3 whitespace-nowrap">{formatNaira(o.amount)}</td>
                  <td className={`p-3 capitalize ${statusColor[o.status]}`}>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
