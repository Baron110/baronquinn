import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { grokFaceSwap } from "@/lib/studio/xai";
import { runReplicateModel } from "@/lib/studio/replicate";
import { rehostResult } from "@/lib/studio/cloudinaryServer";
import { beginGeneration, completeGeneration, refundGeneration } from "@/lib/studio/charge";

const COST = 5000;
const FALLBACK_MODEL = "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Studio tools." }, { status: 401 });
  }

  const { targetImage, sourceImage, regenerateEditId } = await req.json();
  if (!targetImage || !sourceImage) {
    return NextResponse.json(
      { error: "Both the photo to edit and the face to use are required." },
      { status: 400 }
    );
  }

  await connectDB();

  const begin = await beginGeneration({
    userId: session.user.id,
    type: "face-swap",
    cost: COST,
    originalImage: targetImage,
    regenerateEditId
  });
  if (!begin.ok) {
    return NextResponse.json({ error: begin.error }, { status: begin.status });
  }
  const { edit, chargeKind } = begin;

  try {
    let rawResultUrl: string;
    try {
      rawResultUrl = await grokFaceSwap(targetImage, sourceImage);
    } catch (grokErr) {
      console.warn("Grok face swap failed, falling back to Replicate:", grokErr);
      rawResultUrl = await runReplicateModel(FALLBACK_MODEL, { swap_image: sourceImage, input_image: targetImage });
    }
    const resultUrl = await rehostResult(rawResultUrl, "image");
    await completeGeneration(edit, chargeKind, resultUrl);
    return NextResponse.json({ editId: edit._id, previewUrl: `/api/studio/media/${edit._id}?preview=1` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await refundGeneration(session.user.id, chargeKind, COST, edit, message);
    console.error("Face swap failed (both providers):", err);
    const chargeNote = chargeKind === "wallet" ? " You have not been charged." : "";
    return NextResponse.json({ error: `Could not process that swap.${chargeNote}` }, { status: 502 });
  }
}
