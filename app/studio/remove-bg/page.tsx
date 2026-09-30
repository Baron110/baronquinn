"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StudioUploadBox from "@/components/StudioUploadBox";
import { formatNaira } from "@/lib/format";

const COST = 5000;

const TABS = [
  { slug: "remove-bg", name: "Remove background", live: true },
  { slug: "enhance", name: "Enhance", live: false },
  { slug: "prompt-edit", name: "Prompt edit", live: false }
];

export default function RemoveBgPage() {
  const [image, setImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (!image) {
      setError("Upload a photo first.");
      return;
    }
    setError(null);
    setRunning(true);
    setResultUrl(null);

    try {
      const res = await fetch("/api/studio/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image })
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

        <div className="flex justify-center gap-7 my-7 border-b border-line">
          {TABS.map((tab) =>
            tab.live ? (
              <Link
                key={tab.slug}
                href={`/studio/${tab.slug}`}
                className={`pb-2.5 text-sm ${
                  tab.slug === "remove-bg" ? "font-medium border-b-2 border-ink" : "text-ink/40 hover:text-ink"
                }`}
              >
                {tab.name}
              </Link>
            ) : (
              <span key={tab.slug} className="pb-2.5 text-sm text-ink/30 cursor-not-allowed">
                {tab.name}
              </span>
            )
          )}
        </div>

        <div className="bg-paper border border-line rounded-xl p-6">
          <p className="text-sm text-ink/60 mb-5">
            Upload a photo and the background is removed automatically — no prompt needed.
          </p>

          <StudioUploadBox label="Photo" value={resultUrl ?? image} onChange={setImage} />

          {error && <p className="text-xs text-red-700 mt-3">{error}</p>}

          <div className="flex items-center justify-between border-t border-line pt-4 mt-6">
            <span className="text-sm text-ink/60">Cost: {formatNaira(COST)}</span>
            <button
              onClick={handleRun}
              disabled={running || !image}
              className="h-10 px-5 bg-ink text-paper text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? "Processing..." : "Remove background"}
            </button>
          </div>
        </div>

        {resultUrl && (
          <a
            href={resultUrl}
            download
            className="block text-center mt-4 text-xs underline underline-offset-4 text-ink/60 hover:text-ink"
          >
            Download result
          </a>
        )}
      </main>
      <Footer />
    </>
  );
}
