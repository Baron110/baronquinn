import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { createVoiceClone, generateClonedSpeech } from "@/lib/studio/xai";
import { uploadAudioBuffer } from "@/lib/studio/cloudinaryServer";
import { beginGeneration, completeGeneration, refundGeneration } from "@/lib/studio/charge";

const COST = 5000;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Studio tools." }, { status: 401 });
  }

  const { audioBase64, mimeType, text, regenerateEditId } = await req.json();
  if (!audioBase64 || !text?.trim()) {
    return NextResponse.json({ error: "A voice sample and some text are required." }, { status: 400 });
  }

  await connectDB();

  const begin = await beginGeneration({
    userId: session.user.id,
    type: "voice-clone",
    cost: COST,
    prompt: text,
    regenerateEditId
  });
  if (!begin.ok) {
    return NextResponse.json({ error: begin.error }, { status: begin.status });
  }
  const { edit, chargeKind } = begin;

  try {
    const voiceId = await createVoiceClone(audioBase64, mimeType || "audio/mpeg");
    const speechBuffer = await generateClonedSpeech(voiceId, text);
    const resultUrl = await uploadAudioBuffer(speechBuffer);
    await completeGeneration(edit, chargeKind, resultUrl);
    return NextResponse.json({ editId: edit._id, previewUrl: `/api/studio/media/${edit._id}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await refundGeneration(session.user.id, chargeKind, COST, edit, message);
    console.error("Voice clone failed:", err);
    const chargeNote = chargeKind === "wallet" ? " You have not been charged." : "";
    return NextResponse.json({ error: `Could not generate that clip.${chargeNote}` }, { status: 502 });
  }
}
