"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StudioUploadBox from "@/components/StudioUploadBox";
import StudioTabs from "@/components/StudioTabs";
import StudioDisclaimer from "@/components/StudioDisclaimer";
import StudioSaveButton from "@/components/StudioSaveButton";
import { formatNaira } from "@/lib/format";
import { STUDIO_VOICES, DEFAULT_VOICE } from "@/lib/studio/voices";

const COST = 5000;
const COST_WITH_VOICE = 10000; // keep in sync with the API route
const MAX_SPOKEN_CHARS = 250; // keep in sync with the API route

export default function ImageToVideoPage() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const [addVoice, setAddVoice] = useState(false);
  const [voiceId, setVoiceId] = useState<string>(DEFAULT_VOICE);
  const [spokenText, setSpokenText] = useState("");
  const [consent, setConsent] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultMode, setResultMode] = useState<"motion" | "voice" | null>(null);
  const [regenUsed, setRegenUsed] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mode = addVoice ? "voice" : "motion";
  const cost = addVoice ? COST_WITH_VOICE : COST;
  // A free regenerate only applies to the same kind of video it was earned
  // on — a plain video's free retry can't be spent on a talking one.
  const freeRegenAvailable = !regenUsed && resultMode === mode;

  async function handleRun(isRegenerate = false) {
    if (!image) {
      setError("Upload a photo first.");
      return;
    }

    if (addVoice) {
      if (!spokenText.trim()) {
        setError("Type what the voice should say.");
        return;
      }
      if (!consent) {
        setError("Confirm you have permission to use this photo.");
        return;
      }
    } else if (!prompt.trim()) {
      setError("Describe the motion you want.");
      return;
    }

    setError(null);
    setRunning(true);
    if (!isRegenerate) setPreviewUrl(null);

    try {
      const body: Record<string, unknown> = {
        image,
        regenerateEditId: isRegenerate ? editId : undefined
      };
      if (addVoice) {
        body.addVoice = true;
        body.voiceId = voiceId;
        body.spokenText = spokenText;
        body.consent = consent;
      } else {
        body.prompt = prompt;
      }

      const res = await fetch("/api/studio/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      setPreviewUrl(data.previewUrl);
      setEditId(data.editId);
      setRegenUsed(isRegenerate && freeRegenAvailable);
      setResultMode(mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRunning(false);
    }
  }

  const canRun = !!image && !running && (addVoice ? !!spokenText.trim() && consent : true);

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
            {addVoice
              ? "Upload a photo, pick a voice, and type what it should say — the face speaks it with matching lip movement. This takes 1–3 minutes."
              : "Upload a photo and describe how it should move. This takes 1–2 minutes."}
          </p>

          <StudioUploadBox label="Photo" value={image} onChange={setImage} />

          <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
            <input
              type="checkbox"
              checked={addVoice}
              onChange={(e) => setAddVoice(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            <span className="text-sm">
              <span className="font-medium">Add a voice</span>
              <span className="block text-xs text-ink/50 mt-0.5">
                Your photo speaks the words you type, in a voice you choose, with lip-sync. Replaces the motion
                description.
              </span>
            </span>
          </label>

          {addVoice ? (
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-medium mb-2">Voice</p>
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="w-full h-10 px-3 border border-line rounded text-sm bg-paper focus:outline-none focus:border-ink"
                >
                  {STUDIO_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} — {v.note}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium">What should it say?</p>
                  <span className="text-xs text-ink/40">
                    {spokenText.length}/{MAX_SPOKEN_CHARS}
                  </span>
                </div>
                <textarea
                  value={spokenText}
                  onChange={(e) => setSpokenText(e.target.value.slice(0, MAX_SPOKEN_CHARS))}
                  rows={3}
                  placeholder="Type the words you want spoken..."
                  className="w-full border border-line rounded p-3 text-sm focus:outline-none focus:border-ink resize-none"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-xs text-ink/60 leading-relaxed">
                  I own this photo, or I have clear permission from the person in it.
                </span>
              </label>
            </div>
          ) : (
            <div className="mt-4">
              <label className="text-xs font-medium">Describe the motion</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Make her wave and smile at the camera"
                className="w-full mt-2 h-20 px-3 py-2 border border-line rounded text-sm resize-none focus:outline-none focus:border-ink"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-700 mt-3">{error}</p>}

          <div className="flex items-center justify-between border-t border-line pt-4 mt-6">
            <span className="text-sm text-ink/60">Cost: {formatNaira(cost)}</span>
            <button
              onClick={() => handleRun(false)}
              disabled={!canRun}
              className="h-10 px-5 bg-ink text-paper text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? "Generating (1-3 min)..." : addVoice ? "Generate talking video" : "Generate video"}
            </button>
          </div>
        </div>

        {previewUrl && editId && (
          <div className="mt-5">
            <video src={previewUrl} controls className="w-full border border-line rounded-xl" />
            <StudioSaveButton editId={editId} filename="baronquinn-video.mp4" mimeType="video/mp4" />
            <div className="text-center mt-2">
              <button
                onClick={() => handleRun(true)}
                disabled={running}
                className="text-xs underline underline-offset-4 text-ink/50 hover:text-ink disabled:opacity-50"
              >
                {freeRegenAvailable
                  ? "Not quite right? Try again — free, one time"
                  : `Not quite right? Try again (${formatNaira(cost)})`}
              </button>
            </div>
          </div>
        )}
        <StudioDisclaimer />
      </main>
      <Footer />
    </>
  );
}
