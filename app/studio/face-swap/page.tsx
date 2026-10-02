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

export default function FaceSwapPage() {
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [regenUsed, setRegenUsed] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun(isRegenerate = false) {
    if (!targetImage || !sourceImage) {
      setError("Upload both photos first.");
      return;
    }
    setError(null);
    setRunning(true);
    if (!isRegenerate) setPreviewUrl(null);
    try {
      const res = await fetch("/api/studio/face-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetImage, sourceImage, regenerateEditId: isRegenerate ? editId : undefined })
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

        <StudioTabs active="face-swap" />

        <StudioDisclaimer />
        <div className="bg-paper border border-line rounded-xl p-6">
          <p className="text-sm text-ink/60 mb-5">
            Upload the photo to edit, then the photo with the face to swap in.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <StudioUploadBox label="Photo to edit" value={previewUrl ?? targetImage} onChange={setTargetImage} />
            <StudioUploadBox label="Face to use" value={sourceImage} onChange={setSourceImage} />
          </div>

          {error && <p className="text-xs text-red-700 mt-3">{error}</p>}

          <div className="flex items-center justify-between border-t border-line pt-4 mt-6">
            <span className="text-sm text-ink/60">Cost: {formatNaira(COST)}</span>
            <button
              onClick={() => handleRun(false)}
              disabled={running || !targetImage || !sourceImage}
              className="h-10 px-5 bg-ink text-paper text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? "Processing..." : "Swap face"}
            </button>
          </div>
        </div>

        {previewUrl && editId && (
          <>
            <p className="text-center text-xs text-ink/40 mt-4">Preview is watermarked — Save removes it.</p>
            <StudioSaveButton editId={editId} filename="baronquinn-face-swap.png" mimeType="image/png" />
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
      </main>
      <Footer />
    </>
  );
}
