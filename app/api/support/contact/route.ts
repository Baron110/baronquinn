import { NextRequest, NextResponse } from "next/server";
import { sendSupportRequestEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Fill in all fields." }, { status: 400 });
  }

  try {
    await sendSupportRequestEmail(name.trim(), email.trim(), message.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Support request failed:", err);
    return NextResponse.json({ error: "Could not send that — try again in a moment." }, { status: 502 });
  }
}
