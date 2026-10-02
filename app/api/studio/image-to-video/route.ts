import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { grokImageToVideo } from "@/lib/studio/xai";
import { rehostResult } from "@/lib/studio/cloudinaryServer";
import { beginGeneration, completeGeneration, refundGeneration } from "@/lib/studio/charge";

const COST = 5000;

// This can take up to ~3 minutes (polling included) — on Vercel's Hobby
// plan functions cap at 10s, so this route needs at least a Pro plan with
// an extended maxDuration, or a move to background processing later.
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Studio tools." }, { status: 401 });
  }

  const { image, prompt, regenerateEditId } = await req.json();
  if (!image || !prompt?.trim()) {
    return NextResponse.json({ error: "An image and a description of the motion are required." }, { status: 400 });
  }

  await connectDB();

  const begin = await beginGeneration({
    userId: session.user.id,
    type: "image-to-video",
    cost: COST,
    originalImage: image,
    prompt,
    regenerateEditId
  });
  if (!begin.ok) {
    return NextResponse.json({ error: begin.error }, { status: begin.status });
  }
  const { edit, chargeKind } = begin;

  try {
    const rawResultUrl = await grokImageToVideo(image, prompt);
    const resultUrl = await rehostResult(rawResultUrl, "video");
    await completeGeneration(edit, chargeKind, resultUrl);
    // No watermark on video yet (see note in the media route) — same URL
    // serves as both the preview and the clean save for now.
    return NextResponse.json({ editId: edit._id, previewUrl: `/api/studio/media/${edit._id}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await refundGeneration(session.user.id, chargeKind, COST, edit, message);
    console.error("Image to video failed:", err);
    const chargeNote = chargeKind === "wallet" ? " You have not been charged." : "";
    return NextResponse.json({ error: `Could not generate that video.${chargeNote}` }, { status: 502 });
  }
}
