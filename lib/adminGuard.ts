import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return { session: null, error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { session, error: null };
}
