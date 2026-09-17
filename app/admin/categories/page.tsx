"use client";

import { useEffect, useState } from "react";

type Category = { _id: string; slug: string; label: string; blurb?: string };

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [blurb, setBlurb] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then(setCategories);
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, label, blurb: blurb || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create category");
      setLabel("");
      setSlug("");
      setBlurb("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Category) {
    if (!confirm(`Delete "${c.label}"?`)) return;
    const res = await fetch(`/api/admin/categories/${c._id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Could not delete category");
      return;
    }
    load();
  }

  const inputClass = "w-full h-10 px-3 border border-line text-sm focus:outline-none focus:border-ink bg-paper";

  return (
    <div>
      <h1 className="text-3xl mb-6">Categories</h1>

      <div className="border border-line divide-y divide-line mb-10">
        {categories.length === 0 && <p className="p-4 text-sm text-ink/40">No categories yet.</p>}
        {categories.map((c) => (
          <div key={c._id} className="p-4 flex justify-between items-center text-sm">
            <div>
              <p>{c.label}</p>
              <p className="text-ink/40 text-xs">{c.slug}</p>
            </div>
            <div className="flex items-center gap-4">
              {c.blurb && <p className="text-ink/50 text-xs max-w-xs hidden sm:block">{c.blurb}</p>}
              <button onClick={() => handleDelete(c)} className="text-xs text-red-700">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-4">Add category</h2>
      <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-3 max-w-2xl">
        <input className={inputClass} placeholder="Label, e.g. Perfumes" value={label} onChange={(e) => setLabel(e.target.value)} required />
        <input className={inputClass} placeholder="Slug, e.g. perfumes" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <input className={inputClass} placeholder="Blurb (optional)" value={blurb} onChange={(e) => setBlurb(e.target.value)} />
        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-3 h-10 bg-ink text-paper text-sm hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add category"}
        </button>
      </form>
      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </div>
  );
}
