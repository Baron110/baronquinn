"use client";

import { useState } from "react";

export default function StudioSaveButton({
  url,
  filename,
  mimeType
}: {
  url: string;
  filename: string;
  mimeType: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: mimeType });

      // navigator.share with a file attached opens the OS share sheet on
      // phones, which includes a direct "Save to Photos"/"Save image"
      // option — a plain <a download> link usually lands in Files/
      // Downloads instead, not the gallery, which is the actual thing
      // being asked for here.
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      // AbortError just means the person closed the share sheet without
      // picking anything — not a real failure, nothing to show for that.
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Could not save that — try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-center mt-4">
      <button
        onClick={handleSave}
        disabled={busy}
        className="text-xs underline underline-offset-4 text-ink/60 hover:text-ink disabled:opacity-50"
      >
        {busy ? "Preparing..." : "Save"}
      </button>
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
