import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await connectDB();

  const user = await User.findById(session.user.id).select("walletBalance");
  const transactions = await WalletTransaction.find({ user: session.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const totalSpent = transactions
    .filter((t) => t.type === "debit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  return NextResponse.json({
    balance: user?.walletBalance ?? 0,
    totalTransactions: transactions.length,
    totalSpent,
    transactions
  });
}
