import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { generateDocument } from "@/lib/studio/openai";
import { DOC_TEMPLATES } from "@/lib/studio/docTemplates";
import { beginGeneration, completeGeneration, refundGeneration } from "@/lib/studio/charge";

const COST = 5000;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Studio tools." }, { status: 401 });
  }

  const { templateId, details, regenerateEditId } = await req.json();
  const template = DOC_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    return NextResponse.json({ error: "Unknown template." }, { status: 400 });
  }
  if (!details?.trim()) {
    return NextResponse.json({ error: "Add a few details for the document first." }, { status: 400 });
  }

  await connectDB();

  const begin = await beginGeneration({
    userId: session.user.id,
    type: "docs",
    cost: COST,
    prompt: `${template.name}: ${details}`,
    regenerateEditId
  });
  if (!begin.ok) {
    return NextResponse.json({ error: begin.error }, { status: begin.status });
  }
  const { edit, chargeKind } = begin;

  try {
    const text = await generateDocument(template.systemPrompt, details);
    // Docs produces plain text, not a file — resultUrl isn't used the same
    // way here, but still marked completed so it shows correctly in order
    // history and the free-regenerate check still works the same.
    await completeGeneration(edit, chargeKind, "");
    return NextResponse.json({ editId: edit._id, text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await refundGeneration(session.user.id, chargeKind, COST, edit, message);
    console.error("Docs generation failed:", err);
    const chargeNote = chargeKind === "wallet" ? " You have not been charged." : "";
    return NextResponse.json({ error: `Could not generate that document.${chargeNote}` }, { status: 502 });
  }
}
