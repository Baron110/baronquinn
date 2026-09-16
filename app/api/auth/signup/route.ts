import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendVerificationEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "customer",
    emailVerified: false,
    verificationToken,
    verificationTokenExpires
  });

  try {
    await sendVerificationEmail(email.toLowerCase(), name, verificationToken);
  } catch (err) {
    // Account is still created even if the email fails to send —
    // they can hit "resend verification" once logged in.
    console.error("Failed to send verification email:", err);
  }

  return NextResponse.json({ ok: true });
}
