// Server-side upload using the same unsigned preset the client already
// uses — no separate signed API key/secret needed. Cloudinary uploads
// audio through its "video" resource type endpoint.
export async function uploadAudioBuffer(buffer: ArrayBuffer): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary is not configured");

  const formData = new FormData();
  formData.append("file", new Blob([buffer]), "clip.mp3");
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Audio upload failed");
  return data.secure_url;
}
