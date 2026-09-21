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
  const { items: cartItems, sender, recipient, loveNote, address } = body;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
  }
  if (!sender?.email || !sender?.name || !sender?.phone || !recipient?.name || !address?.street) {
    return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
  }

  await connectDB();

  const orderItems = [];
  let amount = 0;

  for (const ci of cartItems) {
    const product = await Product.findOne({ slug: ci.slug, active: true });
    if (!product) {
      return NextResponse.json({ error: `Product no longer available: ${ci.slug}` }, { status: 404 });
    }
    const quantity = Math.max(1, Number(ci.quantity) || 1);
    orderItems.push({
      product: product._id,
      productSlug: product.slug,
      productName: product.name,
      price: product.price,
      quantity
    });
    amount += product.price * quantity;
  }

  // Atomic: only deducts if the balance is still sufficient at the moment of
  // the write. Prevents a double-click or a race between two tabs from
  // spending more than the wallet actually holds.
  const updatedUser = await User.findOneAndUpdate(
    { _id: session.user.id, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } },
    { new: true }
  );

  if (!updatedUser) {
    return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
  }

  const order = await Order.create({
    user: session.user.id,
    items: orderItems,
    amount,
    sender,
    recipient,
    loveNote,
    address,
    reference: `wallet-pay-${Date.now()}`,
    status: "paid"
  });

  await WalletTransaction.create({
    user: session.user.id,
    type: "debit",
    status: "completed",
    amount,
    reference: order.reference,
    relatedOrder: order._id,
    description:
      orderItems.length === 1
        ? `Payment for ${orderItems[0].productName}`
        : `Payment for ${orderItems.length} items`
  });

  try {
    await sendOrderConfirmationEmail(sender.email, {
      items: orderItems,
      amount: order.amount,
      reference: order.reference,
      recipient: order.recipient
    });
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
  }

  return NextResponse.json({ reference: order.reference, status: "paid" });
}
