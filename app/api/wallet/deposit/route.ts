import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";

const MIN_DEPOSIT = 100;
const MAX_DEPOSIT = 1000000;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { amount } = await req.json();

  if (!amount || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) {
    return NextResponse.json(
      { error: `Amount must be between \u20A6${MIN_DEPOSIT.toLocaleString()} and \u20A6${MAX_DEPOSIT.toLocaleString()}` },
      { status: 400 }
    );
  }

  await connectDB();

  // Prefixed "wallet-" so the PayGate notify webhook can tell a deposit
  // apart from an order payment and credit the right thing.
  const reference = `wallet-${session.user.id}-${Date.now()}`;

  await WalletTransaction.create({
    user: session.user.id,
    type: "deposit",
    status: "pending",
    amount,
    reference,
    description: "Wallet top-up"
  });

  return NextResponse.json({ reference, amount });
}
