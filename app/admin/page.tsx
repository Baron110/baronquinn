"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/format";

type Revenue = {
  totalRevenue: number;
  paidOrders: number;
  pendingCount: number;
  failedCount: number;
  daily: { _id: string; revenue: number; orders: number }[];
};

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line p-5">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="text-2xl mt-2">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<Revenue | null>(null);

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h1 className="text-3xl mb-6">Dashboard</h1>

      {!data ? (
        <p className="text-ink/40">Loading...</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-4 gap-4">
            <Card label="Total revenue" value={formatNaira(data.totalRevenue)} />
            <Card label="Paid orders" value={String(data.paidOrders)} />
            <Card label="Pending" value={String(data.pendingCount)} />
            <Card label="Failed" value={String(data.failedCount)} />
          </div>

          <section className="mt-10">
            <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-4">Last 30 days</h2>
            {data.daily.length === 0 ? (
              <p className="text-ink/40 text-sm">No paid orders in this window yet.</p>
            ) : (
              <div className="border border-line">
                {data.daily.map((d) => (
                  <div key={d._id} className="flex justify-between px-4 py-2.5 border-b border-line last:border-b-0 text-sm">
                    <span className="text-ink/60">{d._id}</span>
                    <span>
                      {d.orders} order{d.orders === 1 ? "" : "s"} · {formatNaira(d.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
