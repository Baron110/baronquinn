import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Edit from "@/models/Edit";
import { runReplicateModel } from "@/lib/studio/replicate";

const COST = 5000;
const MODEL = "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285d65c14638cc5f36f34befaf1";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Studio tools." }, { status: 401 });
  }

  const { image } = await req.json();
  if (!image) {
    return NextResponse.json({ error: "An image is required." }, { status: 400 });
  }

  await connectDB();

  // Same atomic pattern as paying for an order with wallet balance — the
  // balance check and the deduction happen in one operation, so two
  // requests firing at once can't both succeed against a balance that only
  // covers one of them.
  const debited = await User.findOneAndUpdate(
    { _id: session.user.id, walletBalance: { $gte: COST } },
    { $inc: { walletBalance: -COST } }
  );
  if (!debited) {
    return NextResponse.json({ error: "Not enough wallet balance for this." }, { status: 402 });
  }

  const edit = await Edit.create({
    user: session.user.id,
    type: "remove-bg",
    originalImage: image,
    status: "processing",
    cost: COST
  });

  try {
    const resultUrl = await runReplicateModel(MODEL, { image });
    edit.status = "completed";
    edit.resultUrl = resultUrl;
    await edit.save();
    return NextResponse.json({ resultUrl });
  } catch (err) {
    // Processing failed on our side, not the customer's — refund rather
    // than charge someone for a result they never got.
    await User.findByIdAndUpdate(session.user.id, { $inc: { walletBalance: COST } });
    edit.status = "failed";
    edit.error = err instanceof Error ? err.message : "Unknown error";
    await edit.save();
    console.error("Remove BG failed:", err);
    return NextResponse.json({ error: "Could not process that image. You have not been charged." }, { status: 502 });
  }
}
