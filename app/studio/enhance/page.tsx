"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StudioUploadBox from "@/components/StudioUploadBox";
import StudioTabs from "@/components/StudioTabs";
import StudioDisclaimer from "@/components/StudioDisclaimer";
import StudioSaveButton from "@/components/StudioSaveButton";
import { formatNaira } from "@/lib/format";

const COST = 5000;

export default function EnhancePage() {
  const [image, setImage] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [regenUsed, setRegenUsed] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun(isRegenerate = false) {
    if (!image) {
      setError("Upload a photo first.");
      return;
    }
    setError(null);
    setRunning(true);
    if (!isRegenerate) setPreviewUrl(null);
    try {
      const res = await fetch("/api/studio/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, regenerateEditId: isRegenerate ? editId : undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setPreviewUrl(data.previewUrl);
      setEditId(data.editId);
      if (isRegenerate) setRegenUsed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <div className="text-center mb-2">
          <h1 className="text-2xl mb-1">Studio</h1>
          <p className="text-sm text-ink/50">Remove backgrounds, enhance photos, and more.</p>
        </div>

        <StudioTabs active="enhance" />
        <div className="bg-paper border border-line rounded-xl p-6">
          <p className="text-sm text-ink/60 mb-5">Sharpen and upscale a photo — good for blurry or low-res images.</p>

          <StudioUploadBox label="Photo" value={previewUrl ?? image} onChange={setImage} />

          {error && <p className="text-xs text-red-700 mt-3">{error}</p>}

          <div className="flex items-center justify-between border-t border-line pt-4 mt-6">
            <span className="text-sm text-ink/60">Cost: {formatNaira(COST)}</span>
            <button
              onClick={() => handleRun(false)}
              disabled={running || !image}
              className="h-10 px-5 bg-ink text-paper text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? "Processing..." : "Enhance"}
            </button>
          </div>
        </div>

        {previewUrl && editId && (
          <>
            <p className="text-center text-xs text-ink/40 mt-4">Preview is watermarked — Save removes it.</p>
            <StudioSaveButton editId={editId} filename="baronquinn-enhanced.png" mimeType="image/png" />
            <div className="text-center mt-2">
              <button
                onClick={() => handleRun(true)}
                disabled={running}
                className="text-xs underline underline-offset-4 text-ink/50 hover:text-ink disabled:opacity-50"
              >
                {regenUsed ? `Not quite right? Try again (${formatNaira(COST)})` : "Not quite right? Try again — free, one time"}
              </button>
            </div>
          </>
        )}
              <StudioDisclaimer />
</main>
      <Footer />
    </>
  );
}
