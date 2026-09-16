"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/format";

type Product = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  active: boolean;
  category?: { label: string };
  images: string[];
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleActive(product: Product) {
    await fetch(`/api/admin/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !product.active })
    });
    load();
  }

  async function remove(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    await fetch(`/api/admin/products/${product._id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl">Products</h1>
        <Link href="/admin/products/new" className="border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper transition-colors">
          + New product
        </Link>
      </div>

      {loading ? (
        <p className="text-ink/40">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-ink/40">No products yet.</p>
      ) : (
        <div className="border border-line divide-y divide-line">
          {products.map((p) => (
            <div key={p._id} className="p-4 flex items-center gap-4">
              <div className="w-14 h-14 bg-bone shrink-0 overflow-hidden">
                {p.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{p.name}</p>
                <p className="text-xs text-ink/40">{p.category?.label ?? "Uncategorized"} · {formatNaira(p.price)}</p>
              </div>
              <button onClick={() => toggleActive(p)} className="text-xs border border-line px-3 py-1.5 hover:border-ink">
                {p.active ? "Active" : "Hidden"}
              </button>
              <button onClick={() => remove(p)} className="text-xs text-red-700 px-2">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
