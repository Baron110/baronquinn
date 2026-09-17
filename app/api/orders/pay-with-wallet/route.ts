import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import { sendOrderConfirmationEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "You must be logged in" }, { status: 401 });

  const body = await req.json();
  const { productSlug, sender, recipient, loveNote, address } = body;

  if (!productSlug || !sender?.email || !sender?.name || !sender?.phone || !recipient?.name || !address?.street) {
    return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
  }

  await connectDB();

  const product = await Product.findOne({ slug: productSlug, active: true });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Atomic: only deducts if the balance is still sufficient at the moment of
  // the write. Prevents a double-click or a race between two tabs from
  // spending more than the wallet actually holds.
  const updatedUser = await User.findOneAndUpdate(
    { _id: session.user.id, walletBalance: { $gte: product.price } },
    { $inc: { walletBalance: -product.price } },
    { new: true }
  );

  if (!updatedUser) {
    return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
  }

  const order = await Order.create({
    user: session.user.id,
    product: product._id,
    productSlug: product.slug,
    productName: product.name,
    amount: product.price,
    sender,
    recipient,
    loveNote,
    address,
    reference: `wallet-pay-${product.slug}-${Date.now()}`,
    status: "paid"
  });

  await WalletTransaction.create({
    user: session.user.id,
    type: "debit",
    status: "completed",
    amount: product.price,
    reference: order.reference,
    relatedOrder: order._id,
    description: `Payment for ${product.name}`
  });

  try {
    await sendOrderConfirmationEmail(sender.email, {
      productName: order.productName,
      amount: order.amount,
      reference: order.reference,
      recipient: order.recipient
    });
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
  }

  return NextResponse.json({ reference: order.reference, status: "paid" });
}
