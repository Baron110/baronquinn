// Grok's image-edit endpoint. Confirmed from PromptStudio's own working
// code: takes a Cloudinary URL (not base64), single image under the key
// "image" (an array "images" is used for multi-image edits like face swap).
const ENDPOINT = "https://api.x.ai/v1/images/edits";

export async function grokImageEdit(imageUrl: string, prompt: string): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY is not set");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "grok-imagine-image-quality",
      prompt,
      image: { url: imageUrl, type: "image_url" }
    })
  });

  const raw = await res.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Grok returned a non-JSON response: ${raw.slice(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Grok request failed (${res.status}): ${raw.slice(0, 300)}`);
  }

  const resultUrl = data?.data?.[0]?.url;
  if (!resultUrl) {
    throw new Error(`Grok succeeded but no image URL was found in the response: ${raw.slice(0, 300)}`);
  }
  return resultUrl;
}

// Multi-image edit (face swap) — same endpoint, but "image" becomes a plural
// array of the two photos instead of a single object.
export async function grokFaceSwap(targetUrl: string, sourceUrl: string): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY is not set");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "grok-imagine-image-quality",
      prompt:
        "Swap the face of the person in the first image with the face from the second image. Keep the body, clothes, background, and lighting exactly the same. Only replace the face realistically.",
      image: [
        { url: targetUrl, type: "image_url" },
        { url: sourceUrl, type: "image_url" }
      ]
    })
  });

  const raw = await res.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Grok returned a non-JSON response: ${raw.slice(0, 300)}`);
  }
  if (!res.ok) throw new Error(data?.error?.message ?? `Grok request failed (${res.status})`);

  const resultUrl = data?.data?.[0]?.url;
  if (!resultUrl) throw new Error("Grok succeeded but no image URL was found in the response");
  return resultUrl;
}

// Voice cloning — step 1: submit a sample and get back a voice_id.
export async function createVoiceClone(audioBase64: string, mimeType: string): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY is not set");

  const res = await fetch("https://api.x.ai/v1/audio/voices", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ audio: { data: audioBase64, type: mimeType }, name: `voice_${Date.now()}` })
  });

  const raw = await res.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`xAI returned a non-JSON response: ${raw.slice(0, 300)}`);
  }
  if (!res.ok) throw new Error(data?.error?.message ?? `Voice clone request failed (${res.status})`);

  const voiceId = data.voice_id ?? data.id;
  if (!voiceId) throw new Error("No voice ID was returned");
  return voiceId;
}

// Voice cloning — step 2: generate speech in the cloned voice. Returns the
// raw audio bytes (the caller uploads them to Cloudinary).
export async function generateClonedSpeech(voiceId: string, text: string): Promise<ArrayBuffer> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY is not set");

  const res = await fetch("https://api.x.ai/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "grok-tts", input: text, voice: voiceId })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Speech generation failed (${res.status}): ${errText.slice(0, 300)}`);
  }
  return res.arrayBuffer();
}

// Image-to-video — submits the job and polls until it's done. Grok's own
// docs poll a slightly different path than what PromptStudio's working code
// actually called — using the confirmed-working one here.
export async function grokImageToVideo(imageUrl: string, prompt: string): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY is not set");

  const submitRes = await fetch("https://api.x.ai/v1/videos/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "grok-imagine-video-1.5",
      prompt,
      image: { url: imageUrl },
      duration: 8
    })
  });

  const submitRaw = await submitRes.text();
  let submitData: any;
  try {
    submitData = JSON.parse(submitRaw);
  } catch {
    throw new Error(`xAI returned a non-JSON response: ${submitRaw.slice(0, 300)}`);
  }
  if (!submitRes.ok) {
    throw new Error(submitData?.error?.message ?? `Video request failed (${submitRes.status})`);
  }

  const requestId = submitData.id ?? submitData.request_id;
  if (!requestId) throw new Error("No request ID was returned for the video job");

  const deadline = Date.now() + 170_000; // stay under a Vercel function's 180s cap
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    const pollRes = await fetch(`https://api.x.ai/v1/videos/generations/${requestId}`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    const pollData = await pollRes.json();

    if (pollData.status === "failed") throw new Error("Video generation failed");
    const videoUrl = pollData.data?.[0]?.url ?? pollData.url;
    if (pollData.status === "completed" || videoUrl) {
      if (!videoUrl) throw new Error("Video job completed but no URL was returned");
      return videoUrl;
    }
  }
  throw new Error("Timed out waiting for the video — it may still finish, try checking back shortly");
}
