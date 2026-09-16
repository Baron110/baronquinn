"use client";

import { useState } from "react";

export default function ImageUploader({
  images,
  onChange
}: {
  images: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!cloudName || !uploadPreset) {
      setError("Cloudinary isn't configured — set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
        uploaded.push(data.secure_url);
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    onChange(images.filter((i) => i !== url));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <div key={url} className="relative w-24 h-24 bg-bone border border-line">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-ink text-paper text-xs flex items-center justify-center rounded-full"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ))}

        <label className="w-24 h-24 border border-dashed border-line flex items-center justify-center text-xs text-ink/50 cursor-pointer hover:border-ink transition-colors text-center px-2">
          {uploading ? "Uploading..." : "+ Add photo"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </div>
  );
}
