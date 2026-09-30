"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StudioUploadBox from "@/components/StudioUploadBox";
import StudioTabs from "@/components/StudioTabs";
import { formatNaira } from "@/lib/format";

const COST = 5000;

export default function ImageToVideoPage() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (!image) {
      setError("Upload a photo first.");
      return;
    }
    if (!prompt.trim()) {
      setError("Describe the motion you want.");
      return;
    }
    setError(null);
    setRunning(true);
    setResultUrl(null);
    try {
      const res = await fetch("/api/studio/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, prompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setResultUrl(data.resultUrl);
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

        <StudioTabs active="image-to-video" />

        <div className="bg-paper border border-line rounded-xl p-6">
          <p className="text-sm text-ink/60 mb-5">
            Upload a photo and describe how it should move. This takes 1–2 minutes.
          </p>

          <StudioUploadBox label="Photo" value={image} onChange={setImage} />

          <div className="mt-4">
            <label className="text-xs font-medium">Describe the motion</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Make her wave and smile at the camera"
              className="w-full mt-2 h-20 px-3 py-2 border border-line rounded text-sm resize-none focus:outline-none focus:border-ink"
            />
          </div>

          {error && <p className="text-xs text-red-700 mt-3">{error}</p>}

          <div className="flex items-center justify-between border-t border-line pt-4 mt-6">
            <span className="text-sm text-ink/60">Cost: {formatNaira(COST)}</span>
            <button
              onClick={handleRun}
              disabled={running || !image}
              className="h-10 px-5 bg-ink text-paper text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? "Generating (1-2 min)..." : "Generate video"}
            </button>
          </div>
        </div>

        {resultUrl && (
          <div className="mt-5">
            <video src={resultUrl} controls className="w-full border border-line rounded-xl" />
            <a
              href={resultUrl}
              download
              className="block text-center mt-3 text-xs underline underline-offset-4 text-ink/60 hover:text-ink"
            >
              Download video
            </a>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
