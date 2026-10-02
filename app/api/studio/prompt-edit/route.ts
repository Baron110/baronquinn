import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { grokImageEdit } from "@/lib/studio/xai";
import { rehostResult } from "@/lib/studio/cloudinaryServer";
import { beginGeneration, completeGeneration, refundGeneration } from "@/lib/studio/charge";

const COST = 5000;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Studio tools." }, { status: 401 });
  }

  const { image, prompt, regenerateEditId } = await req.json();
  if (!image || !prompt?.trim()) {
    return NextResponse.json({ error: "An image and a description of the change are required." }, { status: 400 });
  }

  await connectDB();

  const begin = await beginGeneration({
    userId: session.user.id,
    type: "prompt-edit",
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
    const rawResultUrl = await grokImageEdit(image, prompt);
    const resultUrl = await rehostResult(rawResultUrl, "image");
    await completeGeneration(edit, chargeKind, resultUrl);
    return NextResponse.json({ editId: edit._id, previewUrl: `/api/studio/media/${edit._id}?preview=1` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await refundGeneration(session.user.id, chargeKind, COST, edit, message);
    console.error("Prompt edit failed:", err);
    const chargeNote = chargeKind === "wallet" ? " You have not been charged." : "";
    return NextResponse.json({ error: `Could not process that edit.${chargeNote}` }, { status: 502 });
  }
}
