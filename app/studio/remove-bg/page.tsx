"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImageUploader from "@/components/ImageUploader";
import { formatNaira } from "@/lib/format";

const COST = 5000;

export default function RemoveBgPage() {
  const [images, setImages] = useState<string[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (images.length === 0) {
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
        body: JSON.stringify({ image: images[0] })
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
      <main className="max-w-content mx-auto px-5 py-10">
        <Link href="/studio" className="text-xs text-ink/50 hover:text-ink underline underline-offset-4">
          &larr; Studio
        </Link>

        <h1 className="text-2xl mt-4 mb-1">Remove background</h1>
        <p className="text-sm text-ink/50 mb-8">{formatNaira(COST)} per photo, taken from your wallet.</p>

        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink/50 mb-3">Upload a photo</p>
            <ImageUploader images={images} onChange={(urls) => setImages(urls.slice(-1))} />

            {error && <p className="text-xs text-red-700 mt-3">{error}</p>}

            <button
              onClick={handleRun}
              disabled={running || images.length === 0}
              className="mt-6 h-11 px-6 bg-ink text-paper text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? "Processing..." : `Remove background — ${formatNaira(COST)}`}
            </button>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-ink/50 mb-3">Result</p>
            <div className="border border-line aspect-square flex items-center justify-center bg-bone">
              {resultUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resultUrl} alt="Result" className="max-w-full max-h-full object-contain" />
              ) : (
                <p className="text-xs text-ink/40">{running ? "Working on it..." : "Your result will appear here"}</p>
              )}
            </div>
            {resultUrl && (
              <a
                href={resultUrl}
                download
                className="inline-block mt-4 text-xs underline underline-offset-4 text-ink/60 hover:text-ink"
              >
                Download
              </a>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
