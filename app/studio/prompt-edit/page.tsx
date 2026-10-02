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

export default function PromptEditPage() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
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
    if (!prompt.trim()) {
      setError("Describe what you want changed.");
      return;
    }
    setError(null);
    setRunning(true);
    if (!isRegenerate) setPreviewUrl(null);
    try {
      const res = await fetch("/api/studio/prompt-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, prompt, regenerateEditId: isRegenerate ? editId : undefined })
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

        <StudioTabs active="prompt-edit" />

        <StudioDisclaimer />
        <div className="bg-paper border border-line rounded-xl p-6">
          <p className="text-sm text-ink/60 mb-5">Upload a photo and describe the change you want.</p>

          <StudioUploadBox label="Photo" value={previewUrl ?? image} onChange={setImage} />

          <div className="mt-4">
            <label className="text-xs font-medium">Describe the change</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Change the shirt to red, keep everything else the same"
              className="w-full mt-2 h-20 px-3 py-2 border border-line rounded text-sm resize-none focus:outline-none focus:border-ink"
            />
          </div>

          {error && <p className="text-xs text-red-700 mt-3">{error}</p>}

          <div className="flex items-center justify-between border-t border-line pt-4 mt-6">
            <span className="text-sm text-ink/60">Cost: {formatNaira(COST)}</span>
            <button
              onClick={() => handleRun(false)}
              disabled={running || !image}
              className="h-10 px-5 bg-ink text-paper text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? "Processing..." : "Edit photo"}
            </button>
          </div>
        </div>

        {previewUrl && editId && (
          <>
            <p className="text-center text-xs text-ink/40 mt-4">Preview is watermarked — Save removes it.</p>
            <StudioSaveButton editId={editId} filename="baronquinn-prompt-edit.png" mimeType="image/png" />
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
