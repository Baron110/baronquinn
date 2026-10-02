import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import PageView from "@/models/PageView";

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();
    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const session = await getServerSession(authOptions).catch(() => null);

    await connectDB();
    await PageView.create({ path, user: session?.user?.id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Analytics failing should never surface to a real visitor — log it
    // and move on rather than returning an error status.
    console.error("Pageview tracking failed:", err);
    return NextResponse.json({ ok: false });
  }
}
