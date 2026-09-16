"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";

type Category = { _id: string; slug: string; label: string };

const inputClass = "w-full h-11 px-3 border border-line text-sm focus:outline-none focus:border-ink bg-paper";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("1-2 days");
  const [isCustomized, setIsCustomized] = useState(false);
  const [badge, setBadge] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      setError("Pick a category.");
      return;
    }
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          compareAt: compareAt ? Number(compareAt) : undefined,
          category,
          duration,
          isCustomized,
          badge: badge || undefined,
          images
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create product");
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl mb-6">New product</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs uppercase tracking-wide text-ink/50">Photos</label>
          <div className="mt-1.5">
            <ImageUploader images={images} onChange={setImages} />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-ink/50">Name</label>
          <input className={`${inputClass} mt-1.5`} placeholder="e.g. Chanel No. 5" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-ink/50">Description</label>
          <textarea
            className={`${inputClass} h-24 py-2 resize-none mt-1.5`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/50">Price (NGN)</label>
            <input className={`${inputClass} mt-1.5`} type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/50">Compare-at price (optional)</label>
            <input className={`${inputClass} mt-1.5`} type="number" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/50">Category</label>
            <select className={`${inputClass} mt-1.5`} value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/50">Delivery duration</label>
            <select className={`${inputClass} mt-1.5`} value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option>Same day</option>
              <option>1-2 days</option>
              <option>3-5 days</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/50">Badge (optional)</label>
            <input className={`${inputClass} mt-1.5`} placeholder="e.g. Popular, Fast" value={badge} onChange={(e) => setBadge(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 h-11 text-sm">
            <input type="checkbox" checked={isCustomized} onChange={(e) => setIsCustomized(e.target.checked)} />
            This item takes a custom photo/text/message
          </label>
        </div>

        {error && <p className="text-xs text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="h-12 px-8 bg-ink text-paper text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving..." : "Create product"}
        </button>
      </form>
    </div>
  );
}
