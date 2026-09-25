import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();

  const orders = await Order.find({ user: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(
    orders.map((o: any) => ({
      reference: o.reference,
      items: o.items,
      amount: o.amount,
      status: o.status,
      recipient: o.recipient,
      createdAt: o.createdAt
    }))
  );
}
