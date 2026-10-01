import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Edit from "@/models/Edit";
import { grokFaceSwap } from "@/lib/studio/xai";
import { runReplicateModel } from "@/lib/studio/replicate";
import { rehostResult } from "@/lib/studio/cloudinaryServer";

const COST = 5000;
const FALLBACK_MODEL = "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Studio tools." }, { status: 401 });
  }

  const { targetImage, sourceImage } = await req.json();
  if (!targetImage || !sourceImage) {
    return NextResponse.json(
      { error: "Both the photo to edit and the face to use are required." },
      { status: 400 }
    );
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
    type: "face-swap",
    originalImage: targetImage,
    status: "processing",
    cost: COST
  });

  try {
    let rawResultUrl: string;
    try {
      rawResultUrl = await grokFaceSwap(targetImage, sourceImage);
    } catch (grokErr) {
      console.warn("Grok face swap failed, falling back to Replicate:", grokErr);
      rawResultUrl = await runReplicateModel(FALLBACK_MODEL, { swap_image: sourceImage, input_image: targetImage });
    }
    const resultUrl = await rehostResult(rawResultUrl, "image");
    edit.status = "completed";
    edit.resultUrl = resultUrl;
    await edit.save();
    return NextResponse.json({ resultUrl });
  } catch (err) {
    await User.findByIdAndUpdate(session.user.id, { $inc: { walletBalance: COST } });
    edit.status = "failed";
    edit.error = err instanceof Error ? err.message : "Unknown error";
    await edit.save();
    console.error("Face swap failed (both providers):", err);
    return NextResponse.json({ error: "Could not process that swap. You have not been charged." }, { status: 502 });
  }
}
