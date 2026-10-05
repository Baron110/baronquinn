import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { grokImageToVideo, textToSpeech } from "@/lib/studio/xai";
import { generateTalkingVideo } from "@/lib/studio/lipsync";
import { isStudioVoice } from "@/lib/studio/voices";
import { rehostResult, uploadAudioBuffer } from "@/lib/studio/cloudinaryServer";
import { beginGeneration, completeGeneration, refundGeneration } from "@/lib/studio/charge";

const COST = 5000;

// Adding a voice runs two paid steps back to back (speak the text, animate
// the face) instead of one, so it costs more. This is a starting point —
// check it against your real provider bills and adjust.
const COST_WITH_VOICE = 10000;

// Caps the spoken length (~15-17 seconds of speech), which is what bounds
// both the cost per clip and how long the whole thing can take.
const MAX_SPOKEN_CHARS = 250;

// This can take up to ~3 minutes (polling included) — on Vercel's Hobby
// plan functions cap at 10s, so this route needs at least a Pro plan with
// an extended maxDuration, or a move to background processing later.
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Studio tools." }, { status: 401 });
  }

  const { image, prompt, regenerateEditId, addVoice, voiceId, spokenText, consent } = await req.json();

  const withVoice = addVoice === true;
  const spoken = typeof spokenText === "string" ? spokenText.trim() : "";

  if (!image) {
    return NextResponse.json({ error: "A photo is required." }, { status: 400 });
  }

  if (withVoice) {
    if (!isStudioVoice(voiceId)) {
      return NextResponse.json({ error: "Pick a voice." }, { status: 400 });
    }
    if (!spoken) {
      return NextResponse.json({ error: "Type what the voice should say." }, { status: 400 });
    }
    if (spoken.length > MAX_SPOKEN_CHARS) {
      return NextResponse.json(
        { error: `Keep the spoken text under ${MAX_SPOKEN_CHARS} characters.` },
        { status: 400 }
      );
    }
    // Enforced here, not just in the UI — a form checkbox alone can be
    // bypassed by anyone calling the API directly.
    if (consent !== true) {
      return NextResponse.json(
        { error: "Confirm you have permission to use this photo." },
        { status: 400 }
      );
    }
  } else if (!prompt?.trim()) {
    return NextResponse.json({ error: "A description of the motion is required." }, { status: 400 });
  }

  await connectDB();

  // The voice version is its own edit type, so a free regenerate of a plain
  // video can never be used to get the pricier talking version for nothing.
  const type = withVoice ? "talking-video" : "image-to-video";
  const cost = withVoice ? COST_WITH_VOICE : COST;

  const begin = await beginGeneration({
    userId: session.user.id,
    type,
    cost,
    originalImage: image,
    // For talking videos this stores what was said, so there's a record of
    // every generated clip tied to the account that made it.
    prompt: withVoice ? spoken : prompt,
    regenerateEditId
  });
  if (!begin.ok) {
    return NextResponse.json({ error: begin.error }, { status: begin.status });
  }
  const { edit, chargeKind } = begin;

  try {
    let resultUrl: string;

    if (withVoice) {
      const speech = await textToSpeech(voiceId, spoken);
      const audioUrl = await uploadAudioBuffer(speech);

      // Whatever time is left of the 180s budget, minus room to re-host
      // the finished video at the end.
      const remainingMs = Math.max(20_000, 160_000 - (Date.now() - startedAt));
      const rawVideoUrl = await generateTalkingVideo(image, audioUrl, remainingMs);
      resultUrl = await rehostResult(rawVideoUrl, "video");
    } else {
      const rawResultUrl = await grokImageToVideo(image, prompt);
      resultUrl = await rehostResult(rawResultUrl, "video");
    }

    await completeGeneration(edit, chargeKind, resultUrl);
    // No watermark on video yet (see note in the media route) — same URL
    // serves as both the preview and the clean save for now.
    return NextResponse.json({ editId: edit._id, previewUrl: `/api/studio/media/${edit._id}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await refundGeneration(session.user.id, chargeKind, cost, edit, message);
    console.error(withVoice ? "Talking video failed:" : "Image to video failed:", err);
    const chargeNote = chargeKind === "wallet" ? " You have not been charged." : "";
    return NextResponse.json({ error: `Could not generate that video.${chargeNote}` }, { status: 502 });
  }
}
