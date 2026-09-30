import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Edit from "@/models/Edit";
import { grokImageToVideo } from "@/lib/studio/xai";

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

  const { image, prompt } = await req.json();
  if (!image || !prompt?.trim()) {
    return NextResponse.json({ error: "An image and a description of the motion are required." }, { status: 400 });
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
    type: "image-to-video",
    originalImage: image,
    prompt,
    status: "processing",
    cost: COST
  });

  try {
    const resultUrl = await grokImageToVideo(image, prompt);
    edit.status = "completed";
    edit.resultUrl = resultUrl;
    await edit.save();
    return NextResponse.json({ resultUrl });
  } catch (err) {
    await User.findByIdAndUpdate(session.user.id, { $inc: { walletBalance: COST } });
    edit.status = "failed";
    edit.error = err instanceof Error ? err.message : "Unknown error";
    await edit.save();
    console.error("Image to video failed:", err);
    return NextResponse.json(
      { error: "Could not generate that video. You have not been charged." },
      { status: 502 }
    );
  }
}
