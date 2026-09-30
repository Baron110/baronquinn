import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Edit from "@/models/Edit";
import { generateDocument } from "@/lib/studio/openai";
import { DOC_TEMPLATES } from "@/lib/studio/docTemplates";

const COST = 5000;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Studio tools." }, { status: 401 });
  }

  const { templateId, details } = await req.json();
  const template = DOC_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    return NextResponse.json({ error: "Unknown template." }, { status: 400 });
  }
  if (!details?.trim()) {
    return NextResponse.json({ error: "Add a few details for the document first." }, { status: 400 });
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
    type: "docs",
    prompt: `${template.name}: ${details}`,
    status: "processing",
    cost: COST
  });

  try {
    const text = await generateDocument(template.systemPrompt, details);
    edit.status = "completed";
    await edit.save();
    return NextResponse.json({ text });
  } catch (err) {
    await User.findByIdAndUpdate(session.user.id, { $inc: { walletBalance: COST } });
    edit.status = "failed";
    edit.error = err instanceof Error ? err.message : "Unknown error";
    await edit.save();
    console.error("Docs generation failed:", err);
    return NextResponse.json(
      { error: `Could not generate that document. You have not been charged. (${edit.error})` },
      { status: 502 }
    );
  }
}
