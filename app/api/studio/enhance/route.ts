import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { runReplicateModel } from "@/lib/studio/replicate";
import { rehostResult } from "@/lib/studio/cloudinaryServer";
import { beginGeneration, completeGeneration, refundGeneration } from "@/lib/studio/charge";

const COST = 5000;
const MODEL = "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Studio tools." }, { status: 401 });
  }

  const { image, regenerateEditId } = await req.json();
  if (!image) {
    return NextResponse.json({ error: "An image is required." }, { status: 400 });
  }

  await connectDB();

  const begin = await beginGeneration({
    userId: session.user.id,
    type: "enhance",
    cost: COST,
    originalImage: image,
    regenerateEditId
  });
  if (!begin.ok) {
    return NextResponse.json({ error: begin.error }, { status: begin.status });
  }
  const { edit, chargeKind } = begin;

  try {
    const rawResultUrl = await runReplicateModel(MODEL, { input_image: image, scale_factor: 2, dynamic: 6 });
    const resultUrl = await rehostResult(rawResultUrl, "image");
    await completeGeneration(edit, chargeKind, resultUrl);
    return NextResponse.json({ editId: edit._id, previewUrl: `/api/studio/media/${edit._id}?preview=1` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await refundGeneration(session.user.id, chargeKind, COST, edit, message);
    console.error("Enhance failed:", err);
    const chargeNote = chargeKind === "wallet" ? " You have not been charged." : "";
    return NextResponse.json({ error: `Could not process that image.${chargeNote}` }, { status: 502 });
  }
}
