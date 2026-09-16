import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendVerificationEmail } from "@/lib/emails";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

  user.verificationToken = crypto.randomBytes(32).toString("hex");
  user.verificationTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await user.save();

  await sendVerificationEmail(user.email, user.name, user.verificationToken);

  return NextResponse.json({ ok: true });
}
