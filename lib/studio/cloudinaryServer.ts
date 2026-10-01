// Server-side uploads using the same unsigned preset the client already
// uses — no separate signed API key/secret needed. Cloudinary serves audio
// and video through the same "video" resource-type endpoint.

async function upload(buffer: ArrayBuffer, filename: string, resourceType: "image" | "video"): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary is not configured");

  const formData = new FormData();
  formData.append("file", new Blob([buffer]), filename);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
  return data.secure_url;
}

export async function uploadAudioBuffer(buffer: ArrayBuffer): Promise<string> {
  return upload(buffer, "clip.mp3", "video");
}

// Downloads a result from wherever a provider hosted it, then re-uploads it
// to Baronquinn's own Cloudinary — so the URL a customer ever sees is always
// yours, never api.replicate.delivery, x.ai, or anywhere else that would
// reveal which service generated it.
export async function rehostResult(providerUrl: string, kind: "image" | "video"): Promise<string> {
  const res = await fetch(providerUrl);
  if (!res.ok) throw new Error(`Could not fetch the generated ${kind} to re-host it`);
  const buffer = await res.arrayBuffer();
  return upload(buffer, kind === "image" ? "result.png" : "result.mp4", kind === "image" ? "image" : "video");
}
