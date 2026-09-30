import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Edit from "@/models/Edit";
import { createVoiceClone, generateClonedSpeech } from "@/lib/studio/xai";
import { uploadAudioBuffer } from "@/lib/studio/cloudinaryServer";

const COST = 5000;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Studio tools." }, { status: 401 });
  }

  const { audioBase64, mimeType, text } = await req.json();
  if (!audioBase64 || !text?.trim()) {
    return NextResponse.json({ error: "A voice sample and some text are required." }, { status: 400 });
  }

  await connectDB();

  const debited = await User.findOneAndUpdate(
    { _id: session.user.id, walletBalance: { $gte: COST } },
    { $inc: { walletBalance: -COST } }
  );
  if (!debited) {
    return NextResponse.json({ error: "Not enough wallet balance for this." }, { status: 402 });
  }

  const edit = await Edit.create({
    user: session.user.id,
    type: "voice-clone",
    prompt: text,
    status: "processing",
    cost: COST
  });

  try {
    const voiceId = await createVoiceClone(audioBase64, mimeType || "audio/mpeg");
    const speechBuffer = await generateClonedSpeech(voiceId, text);
    const resultUrl = await uploadAudioBuffer(speechBuffer);

    edit.status = "completed";
    edit.resultUrl = resultUrl;
    await edit.save();
    return NextResponse.json({ resultUrl });
  } catch (err) {
    await User.findByIdAndUpdate(session.user.id, { $inc: { walletBalance: COST } });
    edit.status = "failed";
    edit.error = err instanceof Error ? err.message : "Unknown error";
    await edit.save();
    console.error("Voice clone failed:", err);
    return NextResponse.json(
      { error: `Could not generate that clip. You have not been charged. (${edit.error})` },
      { status: 502 }
    );
  }
}
