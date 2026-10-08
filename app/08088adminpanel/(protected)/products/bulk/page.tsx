"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/format";

type Category = { _id: string; slug: string; label: string };
type Box = { x: number; y: number; w: number; h: number };
type Mode = "photo" | "screenshot";

type Row = {
  id: string;
  fileName: string;
  status: "analyzing" | "ready" | "error" | "publishing" | "published" | "failed";
  message?: string;
  name: string;
  description: string;
  aiCategoryId: string; // the AI's suggestion (not selected until you tap it)
  categoryId: string;
  price: string;
  duration: string;
  isCustomized: boolean;
  badge: string;
  box: Box | null;
  previewUrl: string;
  originalUrl: string;
  durationTouched: boolean;
  customTouched: boolean;
};

const DURATIONS = ["Same day", "1-2 days", "1-3 days", "3-5 days", "7-14 days (1-2 days to USA)"];
const BADGES = ["", "Popular", "New", "Custom"];
const MAX_FILES = 40;
const CONCURRENCY = 3;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not open this image"));
    img.src = url;
  });
}

function drawToCanvas(img: HTMLImageElement, box: Box | null, maxEdge: number): HTMLCanvasElement {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const sx = box ? Math.round(box.x * nw) : 0;
  const sy = box ? Math.round(box.y * nh) : 0;
  const sw = Math.max(1, box ? Math.round(box.w * nw) : nw);
  const sh = Math.max(1, box ? Math.round(box.h * nh) : nh);
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), "image/jpeg", quality);
  });
}

function defaultsFor(slug: string): { duration: string; custom: boolean } {
  if (slug.includes("same-day")) return { duration: "Same day", custom: false };
  if (slug.includes("custom")) return { duration: "7-14 days (1-2 days to USA)", custom: true };
  return { duration: "1-3 days", custom: false };
}

const inputClass = "w-full h-11 px-3 border border-line text-sm focus:outline-none focus:border-ink bg-paper";

function Chip({
  active,
  hint,
  onClick,
  children
}: {
  active: boolean;
  hint?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-3 text-sm border transition-colors ${
        active
          ? "bg-ink text-paper border-ink"
          : hint
          ? "border-rust text-rust hover:bg-rust hover:text-paper"
          : "border-line hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Chevron({ up }: { up?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={up ? "M5 12l5-5 5 5" : "M5 8l5 5 5-5"} />
    </svg>
  );
}

export default function BulkAddPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [commonPrices, setCommonPrices] = useState<number[]>([]);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("photo");
  const [rows, setRows] = useState<Row[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [goLive, setGoLive] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const imgs = useRef<Map<string, HTMLImageElement>>(new Map());
  const modeByRow = useRef<Map<string, Mode>>(new Map());
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/products/bulk-meta")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setCategories(d.categories ?? []);
        setCommonPrices(d.commonPrices ?? []);
      })
      .catch((e) => setMetaError(e instanceof Error ? e.message : "Could not load categories"));
  }, []);

  // Warn before leaving with unpublished work (photos only live in this tab).
  const unpublished = rows.filter((r) => r.status !== "published").length;
  useEffect(() => {
    if (unpublished === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [unpublished]);

  function patch(id: string, changes: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  const catById = useMemo(() => new Map(categories.map((c) => [c._id, c])), [categories]);
  const catBySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c])), [categories]);

  function isReady(r: Row) {
    return (
      (r.status === "ready" || r.status === "failed" || r.status === "error") &&
      r.name.trim().length > 0 &&
      Number(r.price) > 0 &&
      !!r.categoryId
    );
  }

  // ---- adding photos ----------------------------------------------------

  async function analyseRow(id: string, file: File, rowMode: Mode) {
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      imgs.current.set(id, img);

      const canvas = drawToCanvas(img, null, rowMode === "screenshot" ? 1600 : 1024);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      const res = await fetch("/api/admin/products/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          mode: rowMode,
          categories: categories.map((c) => ({ slug: c.slug, label: c.label }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");

      const box: Box | null = rowMode === "screenshot" ? data.box ?? null : null;
      const previewUrl = URL.createObjectURL(await canvasToBlob(drawToCanvas(img, box, 700), 0.85));
      const suggested = catBySlug.get(data.categorySlug);

      patch(id, {
        status: "ready",
        name: data.name ?? "",
        description: data.description ?? "",
        aiCategoryId: suggested?._id ?? "",
        isCustomized: !!data.looksCustom,
        box,
        previewUrl
      });
    } catch (err) {
      patch(id, { status: "error", message: err instanceof Error ? err.message : "Could not read this image" });
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (categories.length === 0) {
      alert("Categories haven't loaded yet. Wait a second and try again.");
      return;
    }
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, MAX_FILES);

    const newRows: Row[] = picked.map((f) => {
      const id = uid();
      const url = URL.createObjectURL(f);
      modeByRow.current.set(id, mode);
      return {
        id,
        fileName: f.name,
        status: "analyzing",
        name: "",
        description: "",
        aiCategoryId: "",
        categoryId: "",
        price: "",
        duration: "1-3 days",
        isCustomized: false,
        badge: "",
        box: null,
        previewUrl: url,
        originalUrl: url,
        durationTouched: false,
        customTouched: false
      };
    });
    setRows((prev) => [...prev, ...newRows]);
    if (fileInput.current) fileInput.current.value = "";

    // small worker pool so 30 photos don't hit the API all at once
    const queue = newRows.map((r, i) => ({ id: r.id, file: picked[i], mode: modeByRow.current.get(r.id) ?? mode }));
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length) {
        const job = queue.shift();
        if (job) await analyseRow(job.id, job.file, job.mode);
      }
    });
    await Promise.all(workers);
  }

  // ---- editing ----------------------------------------------------------

  function pickCategory(r: Row, categoryId: string) {
    const slug = catById.get(categoryId)?.slug ?? "";
    const d = defaultsFor(slug);
    patch(r.id, {
      categoryId,
      duration: r.durationTouched ? r.duration : d.duration,
      isCustomized: r.customTouched ? r.isCustomized : d.custom,
      badge: r.badge === "" && d.custom ? "Custom" : r.badge
    });
  }

  function copyFromPrevious(index: number) {
    const prev = [...rows.slice(0, index)].reverse().find((r) => r.categoryId && Number(r.price) > 0);
    if (!prev) return;
    patch(rows[index].id, {
      categoryId: prev.categoryId,
      price: prev.price,
      duration: prev.duration,
      isCustomized: prev.isCustomized,
      badge: prev.badge,
      durationTouched: true,
      customTouched: true
    });
  }

  async function updateBox(r: Row, box: Box | null) {
    patch(r.id, { box });
    const img = imgs.current.get(r.id);
    if (!img) return;
    try {
      const url = URL.createObjectURL(await canvasToBlob(drawToCanvas(img, box, 700), 0.85));
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, previewUrl: url } : x)));
    } catch {
      /* preview only */
    }
  }

  function removeRow(id: string) {
    imgs.current.delete(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (openId === id) setOpenId(null);
  }

  function openNextIncomplete(fromId: string) {
    const start = rows.findIndex((r) => r.id === fromId);
    const next = rows.slice(start + 1).find((r) => r.status !== "published" && !isReady(r));
    setOpenId(next ? next.id : null);
  }

  // ---- publishing -------------------------------------------------------

  async function uploadToCloudinary(blob: Blob): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) throw new Error("Cloudinary isn't configured");
    const form = new FormData();
    form.append("file", blob, "product.jpg");
    form.append("upload_preset", preset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? "Photo upload failed");
    return data.secure_url;
  }

  async function publishAll() {
    const todo = rows.filter(isReady);
    if (todo.length === 0) return;
    setPublishing(true);

    for (const r of todo) {
      patch(r.id, { status: "publishing", message: undefined });
      try {
        const img = imgs.current.get(r.id);
        if (!img) throw new Error("Photo is no longer loaded — remove this row and add the photo again");
        const blob = await canvasToBlob(drawToCanvas(img, r.box, 1600), 0.9);
        const url = await uploadToCloudinary(blob);

        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: r.name.trim(),
            description: r.description.trim(),
            price: Number(r.price),
            category: r.categoryId,
            images: [url],
            duration: r.duration,
            isCustomized: r.isCustomized,
            badge: r.badge || undefined,
            active: goLive
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not save product");
        patch(r.id, { status: "published" });
      } catch (err) {
        patch(r.id, { status: "failed", message: err instanceof Error ? err.message : "Failed" });
      }
    }
    setPublishing(false);
    setOpenId(null);
  }

  const readyCount = rows.filter(isReady).length;
  const analyzingCount = rows.filter((r) => r.status === "analyzing").length;
  const publishedCount = rows.filter((r) => r.status === "published").length;

  // ---- render -----------------------------------------------------------

  return (
    <div className="pb-28">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl">Bulk add</h1>
        <Link href="/08088adminpanel/products" className="text-sm underline underline-offset-4">
          Back to products
        </Link>
      </div>
      <p className="text-sm text-ink/50 mb-6">
        Drop in many photos. The AI reads each one and fills the name and description. You just tap a row, pick the category and type
        the price.
      </p>

      {metaError && <p className="text-sm text-red-700 mb-4">{metaError}</p>}

      <div className="border border-line p-4 mb-6">
        <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">What are you uploading?</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <Chip active={mode === "photo"} onClick={() => setMode("photo")}>
            Product photos
          </Chip>
          <Chip active={mode === "screenshot"} onClick={() => setMode("screenshot")}>
            Screenshots (read name + crop photo)
          </Chip>
        </div>
        <p className="text-xs text-ink/50 mb-4">
          {mode === "photo"
            ? "The AI names each product from what it sees."
            : "The AI reads the product name from the screenshot, then crops out only the product photo and ignores the rest. You can fix the crop in each row."}
        </p>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="bulk-files"
        />
        <label
          htmlFor="bulk-files"
          className="inline-flex items-center justify-center h-11 px-6 bg-ink text-paper text-sm cursor-pointer hover:opacity-90"
        >
          Choose up to {MAX_FILES} images
        </label>
      </div>

      {rows.length > 0 && (
        <p className="text-sm text-ink/60 mb-3">
          {analyzingCount > 0 && <>Reading {analyzingCount} image{analyzingCount === 1 ? "" : "s"}… · </>}
          {readyCount} ready · {rows.length - publishedCount - readyCount} need attention
          {publishedCount > 0 && <> · {publishedCount} published</>}
        </p>
      )}

      <div className="border border-line divide-y divide-line">
        {rows.map((r, index) => {
          const open = openId === r.id;
          const published = r.status === "published";
          const cat = catById.get(r.categoryId);
          const ready = isReady(r);

          return (
            <div key={r.id} className={published ? "bg-bone/60" : ""}>
              <button
                type="button"
                disabled={published}
                onClick={() => setOpenId(open ? null : r.id)}
                className="w-full p-3 flex items-center gap-3 text-left disabled:cursor-default"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.previewUrl} alt="" className="w-14 h-14 object-cover bg-bone shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm truncate">
                    {r.status === "analyzing" ? "Reading photo…" : r.name || "Untitled — tap to name"}
                  </span>
                  <span className="block text-xs text-ink/50 truncate">
                    {published
                      ? "Published"
                      : r.status === "error"
                      ? r.message
                      : r.status === "failed"
                      ? `Failed: ${r.message}`
                      : r.status === "publishing"
                      ? "Publishing…"
                      : cat || Number(r.price) > 0
                      ? `${cat?.label ?? "No category"} · ${Number(r.price) > 0 ? formatNaira(Number(r.price)) : "no price"}`
                      : "Needs category & price"}
                  </span>
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    published ? "bg-green-600" : ready ? "bg-green-600" : r.status === "analyzing" ? "bg-ink/30 animate-pulse" : "bg-rust"
                  }`}
                />
                {!published && (
                  <span className="shrink-0 text-ink/60">
                    <Chevron up={open} />
                  </span>
                )}
              </button>

              {open && !published && (
                <div className="px-3 pb-4 space-y-4">
                  <div className="flex gap-4 flex-col sm:flex-row">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.previewUrl} alt="" className="w-full sm:w-48 h-48 object-cover bg-bone border border-line" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-ink/50">Name</label>
                        <input
                          className={`${inputClass} mt-1`}
                          value={r.name}
                          onChange={(e) => patch(r.id, { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-ink/50">Description</label>
                        <textarea
                          className={`${inputClass} h-20 py-2 resize-none mt-1`}
                          value={r.description}
                          onChange={(e) => patch(r.id, { description: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">Category</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <Chip
                          key={c._id}
                          active={r.categoryId === c._id}
                          hint={r.aiCategoryId === c._id && r.categoryId !== c._id}
                          onClick={() => pickCategory(r, c._id)}
                        >
                          {r.aiCategoryId === c._id && r.categoryId !== c._id ? "✨ " : ""}
                          {c.label}
                        </Chip>
                      ))}
                    </div>
                    {r.aiCategoryId && !r.categoryId && (
                      <p className="text-xs text-ink/40 mt-1.5">✨ = the AI&apos;s guess. Tap to use it.</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wide text-ink/50">Price (NGN)</label>
                    <input
                      className={`${inputClass} mt-1 text-lg`}
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 45000"
                      value={r.price}
                      onChange={(e) => patch(r.id, { price: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {commonPrices.map((p) => (
                        <Chip key={p} active={Number(r.price) === p} onClick={() => patch(r.id, { price: String(p) })}>
                          {formatNaira(p)}
                        </Chip>
                      ))}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => copyFromPrevious(index)}
                          className="h-9 px-3 text-sm border border-dashed border-ink/40 hover:border-ink"
                        >
                          Same as previous
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">Delivery</p>
                    <div className="flex flex-wrap gap-2">
                      {DURATIONS.map((d) => (
                        <Chip
                          key={d}
                          active={r.duration === d}
                          onClick={() => patch(r.id, { duration: d, durationTouched: true })}
                        >
                          {d}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">Badge</p>
                      <div className="flex flex-wrap gap-2">
                        {BADGES.map((b) => (
                          <Chip key={b || "none"} active={r.badge === b} onClick={() => patch(r.id, { badge: b })}>
                            {b || "None"}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={r.isCustomized}
                        onChange={(e) => patch(r.id, { isCustomized: e.target.checked, customTouched: true })}
                      />
                      Takes a custom photo/text
                    </label>
                  </div>

                  <CropEditor row={r} img={imgs.current.get(r.id)} onChange={(b) => updateBox(r, b)} />

                  <div className="flex items-center justify-between pt-1">
                    <button type="button" onClick={() => removeRow(r.id)} className="text-xs text-red-700">
                      Remove this one
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          openNextIncomplete(r.id);
                        }}
                        className="h-10 px-4 text-sm border border-line hover:border-ink"
                      >
                        Next ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenId(null)}
                        className="h-10 px-4 text-sm bg-ink text-paper hover:opacity-90 inline-flex items-center gap-2"
                      >
                        Done <Chevron up />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rows.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-paper border-t border-line z-30">
          <div className="max-w-content mx-auto px-5 py-3 flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={goLive} onChange={(e) => setGoLive(e.target.checked)} />
              Make live right away
            </label>
            <span className="text-sm text-ink/50 flex-1 min-w-[120px]">
              {readyCount} of {rows.length - publishedCount} ready
            </span>
            {publishedCount > 0 && (
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((r) => r.status !== "published"))}
                className="text-xs underline underline-offset-4"
              >
                Clear published
              </button>
            )}
            <button
              type="button"
              disabled={readyCount === 0 || publishing || analyzingCount > 0}
              onClick={publishAll}
              className="h-11 px-6 bg-ink text-paper text-sm hover:opacity-90 disabled:opacity-40"
            >
              {publishing ? "Publishing…" : `Publish ${readyCount} product${readyCount === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Manual cropping: drag the box to move it, drag a corner to resize it.
// Works with a finger or a mouse. Presets lock the shape (square suits the
// product cards best). Free = any shape.
type Ratio = "free" | "1:1" | "4:5" | "3:4";
const RATIOS: Record<Ratio, number | null> = { free: null, "1:1": 1, "4:5": 4 / 5, "3:4": 3 / 4 };
const MIN = 0.08;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function CropEditor({ row, img, onChange }: { row: Row; img?: HTMLImageElement; onChange: (b: Box | null) => void }) {
  const [show, setShow] = useState(false);
  const [ratio, setRatio] = useState<Ratio>("free");
  const [draft, setDraft] = useState<Box | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{ kind: "move" | "tl" | "tr" | "bl" | "br"; start: Box; px: number; py: number } | null>(null);

  const box: Box = draft ?? row.box ?? { x: 0, y: 0, w: 1, h: 1 };
  // image aspect (width / height) — converts between fractions and pixels
  const A = img && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;

  function commit(b: Box) {
    const full = b.w > 0.985 && b.h > 0.985;
    onChange(full ? null : b);
  }

  function applyRatio(next: Ratio) {
    setRatio(next);
    const r = RATIOS[next];
    if (!r) return;
    // biggest box of this shape, centred on the current box
    let w = box.w;
    let h = (w * A) / r;
    if (h > 1) {
      h = 1;
      w = (h * r) / A;
    }
    if (w > 1) {
      w = 1;
      h = (w * A) / r;
    }
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const b = { x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h };
    setDraft(null);
    commit(b);
  }

  function begin(e: React.PointerEvent, kind: "move" | "tl" | "tr" | "bl" | "br") {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind, start: box, px: e.clientX, py: e.clientY };
  }

  function move(e: React.PointerEvent) {
    const d = drag.current;
    const el = wrap.current;
    if (!d || !el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - d.px) / rect.width;
    const dy = (e.clientY - d.py) / rect.height;
    const s = d.start;

    if (d.kind === "move") {
      setDraft({ ...s, x: clamp(s.x + dx, 0, 1 - s.w), y: clamp(s.y + dy, 0, 1 - s.h) });
      return;
    }

    const right = d.kind === "tr" || d.kind === "br";
    const bottom = d.kind === "bl" || d.kind === "br";
    const ax = right ? s.x : s.x + s.w; // opposite (fixed) corner
    const ay = bottom ? s.y : s.y + s.h;
    const pointX = clamp((right ? s.x + s.w : s.x) + dx, 0, 1);
    const pointY = clamp((bottom ? s.y + s.h : s.y) + dy, 0, 1);
    const maxW = right ? 1 - ax : ax;
    const maxH = bottom ? 1 - ay : ay;

    let w = clamp(Math.abs(pointX - ax), MIN, maxW);
    let h = clamp(Math.abs(pointY - ay), MIN, maxH);
    const r = RATIOS[ratio];
    if (r) {
      w = clamp(w, MIN, Math.min(maxW, (maxH * r) / A));
      h = (w * A) / r;
    }
    setDraft({ x: right ? ax : ax - w, y: bottom ? ay : ay - h, w, h });
  }

  function end() {
    if (!drag.current) return;
    drag.current = null;
    if (draft) {
      commit(draft);
      setDraft(null);
    }
  }

  if (!show) {
    return (
      <button type="button" onClick={() => setShow(true)} className="h-9 px-3 text-sm border border-line hover:border-ink">
        ✂ Crop photo{row.box ? " (cropped)" : ""}
      </button>
    );
  }

  const handle = "absolute w-7 h-7 bg-paper border-2 border-ink rounded-full";

  return (
    <div className="border border-line p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-ink/50 mr-1">Crop shape</span>
        {(Object.keys(RATIOS) as Ratio[]).map((k) => (
          <Chip key={k} active={ratio === k} onClick={() => applyRatio(k)}>
            {k === "free" ? "Free" : k === "1:1" ? "Square" : k}
          </Chip>
        ))}
      </div>

      <div
        ref={wrap}
        className="relative w-full max-w-sm mx-auto select-none overflow-hidden bg-bone"
        style={{ touchAction: "none" }}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={row.originalUrl} alt="" draggable={false} className="w-full block pointer-events-none" />
        <div
          className="absolute border-2 border-white cursor-move"
          style={{
            left: `${box.x * 100}%`,
            top: `${box.y * 100}%`,
            width: `${box.w * 100}%`,
            height: `${box.h * 100}%`,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            touchAction: "none"
          }}
          onPointerDown={(e) => begin(e, "move")}
        >
          <div className={`${handle} -left-3.5 -top-3.5 cursor-nwse-resize`} style={{ touchAction: "none" }} onPointerDown={(e) => begin(e, "tl")} />
          <div className={`${handle} -right-3.5 -top-3.5 cursor-nesw-resize`} style={{ touchAction: "none" }} onPointerDown={(e) => begin(e, "tr")} />
          <div className={`${handle} -left-3.5 -bottom-3.5 cursor-nesw-resize`} style={{ touchAction: "none" }} onPointerDown={(e) => begin(e, "bl")} />
          <div className={`${handle} -right-3.5 -bottom-3.5 cursor-nwse-resize`} style={{ touchAction: "none" }} onPointerDown={(e) => begin(e, "br")} />
        </div>
      </div>
      <p className="text-xs text-ink/40 text-center">Drag the box to move it. Drag a corner to resize.</p>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => {
            setRatio("free");
            setDraft(null);
            onChange(null);
          }}
          className="text-xs underline underline-offset-4"
        >
          Reset to the whole image
        </button>
        <button type="button" onClick={() => setShow(false)} className="text-xs underline underline-offset-4">
          Close
        </button>
      </div>
    </div>
  );
}
