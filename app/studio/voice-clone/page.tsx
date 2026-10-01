"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StudioTabs from "@/components/StudioTabs";
import StudioSaveButton from "@/components/StudioSaveButton";
import { formatNaira } from "@/lib/format";

const COST = 5000;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VoiceClonePage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (!audioFile) {
      setError("Upload a voice sample first (1-2 minutes of clear speech works best).");
      return;
    }
    if (!text.trim()) {
      setError("Type the text you want spoken in the cloned voice.");
      return;
    }
    setError(null);
    setRunning(true);
    setResultUrl(null);

    try {
      const audioBase64 = await fileToBase64(audioFile);
      const res = await fetch("/api/studio/voice-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, mimeType: audioFile.type, text })
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

        <StudioTabs active="voice-clone" />

        <div className="bg-paper border border-line rounded-xl p-6">
          <p className="text-sm text-ink/60 mb-5">
            Upload a short voice sample (1-2 minutes of clear speech), then type anything — it comes back read in
            that voice.
          </p>

          <div className="mb-5">
            <p className="text-xs font-medium mb-2">Voice sample</p>
            <label className="block border border-dashed border-line rounded hover:border-ink transition-colors cursor-pointer py-8 text-center">
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              />
              <span className="text-xs text-ink/40">
                {audioFile ? audioFile.name : "Click to upload an audio file"}
              </span>
            </label>
          </div>

          <div className="mb-5">
            <p className="text-xs font-medium mb-2">Text to speak</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Type what you want the cloned voice to say..."
              className="w-full border border-line rounded p-3 text-sm focus:outline-none focus:border-ink resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-700 mb-3">{error}</p>}

          <div className="flex items-center justify-between border-t border-line pt-4">
            <span className="text-sm text-ink/60">Cost: {formatNaira(COST)}</span>
            <button
              onClick={handleRun}
              disabled={running || !audioFile || !text.trim()}
              className="h-10 px-5 bg-ink text-paper text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? "Generating..." : "Generate voice clip"}
            </button>
          </div>

          {resultUrl && (
            <div className="mt-5 pt-5 border-t border-line">
              <audio controls src={resultUrl} className="w-full" />
              <StudioSaveButton url={resultUrl} filename="baronquinn-voice.mp3" mimeType="audio/mpeg" />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
