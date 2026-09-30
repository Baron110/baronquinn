"use client";

import { useState } from "react";

export default function StudioUploadBox({
  label,
  value,
  onChange
}: {
  label: string;
  value: string | null;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!cloudName || !uploadPreset) {
      setError("Cloudinary isn't configured.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
      onChange(data.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-medium mb-2">{label}</p>
      <label className="block border border-dashed border-line rounded hover:border-ink transition-colors cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={uploading}
        />
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full max-h-64 object-contain py-4" />
        ) : (
          <div className="py-10 text-center text-ink/40">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2">
              <path
                d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.3 8.02 4.5 4.5 0 0 1 16.5 17H16M12 13v7m0-7 3 3m-3-3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xs">{uploading ? "Uploading..." : "Click to upload"}</span>
          </div>
        )}
      </label>
      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </div>
  );
}
