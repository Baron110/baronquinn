import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import WalletTransaction from "@/models/WalletTransaction";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  await connectDB();

  const isWallet = reference.startsWith("wallet-");
  const record = isWallet
    ? await WalletTransaction.findOne({ reference }).lean()
    : await Order.findOne({ reference }).lean();

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const r = record as any;
  const status = isWallet ? (r.status === "completed" ? "paid" : r.status) : r.status;

  return NextResponse.json({
    type: isWallet ? "wallet" : "order",
    status,
    amount: r.amount,
    payment: r.payment ?? null
  });
}
